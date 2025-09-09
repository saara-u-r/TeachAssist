import type React from "react"
import { useState } from "react"
import { Plus, Check, Clock, Edit2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { format, parseISO } from "date-fns"
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz"

interface Event {
  id: string
  title: string
  description?: string
  start_time: string
  end_time?: string
  type: string
  completed?: boolean
}

export default function Calendar() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    type: "class",
  })

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("start_time", { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  const addEventMutation = useMutation({
    mutationFn: async (eventData: Omit<Event, "id" | "completed">) => {
      if (!user?.id) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("calendar_events")
        .insert([
          {
            ...eventData,
            user_id: user.id,
            completed: false,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast.success("Event added successfully")
      setIsDialogOpen(false)
      resetForm()
    },
    onError: () => {
      toast.error("Failed to add event")
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: async (event: Event) => {
      if (!user?.id) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          type: event.type,
        })
        .eq("id", event.id)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast.success("Event updated successfully")
      setIsDialogOpen(false)
      setEditingEvent(null)
      resetForm()
    },
    onError: () => {
      toast.error("Failed to update event")
    },
  })

  const completeEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("calendar_events")
        .update({ completed: true })
        .eq("id", eventId)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      queryClient.invalidateQueries({ queryKey: ["upcomingEvents"] }) // Invalidate dashboard events
      toast.success("Event marked as completed")
    },
    onError: () => {
      toast.error("Failed to complete event")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const eventData = {
        ...newEvent,
        start_time: zonedTimeToUtc(new Date(newEvent.start_time), "Asia/Kolkata").toISOString(),
        end_time: newEvent.end_time
          ? zonedTimeToUtc(new Date(newEvent.end_time), "Asia/Kolkata").toISOString()
          : undefined,
      }
      if (editingEvent) {
        await updateEventMutation.mutateAsync({
          ...editingEvent,
          ...eventData,
        } as Event)
      } else {
        await addEventMutation.mutateAsync(eventData)
      }
    } catch (error) {
      console.error("Submission error:", error)
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      description: event.description || "",
      start_time: format(utcToZonedTime(parseISO(event.start_time), "Asia/Kolkata"), "yyyy-MM-dd'T'HH:mm"),
      end_time: event.end_time
        ? format(utcToZonedTime(parseISO(event.end_time), "Asia/Kolkata"), "yyyy-MM-dd'T'HH:mm")
        : "",
      type: event.type,
    })
    setIsDialogOpen(true)
  }

  const handleComplete = (eventId: string) => {
    if (window.confirm("Mark this event as completed?")) {
      completeEventMutation.mutate(eventId)
    }
  }

  const resetForm = () => {
    setNewEvent({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      type: "class",
    })
  }

  const isEventOverdue = (event: Event) => {
    if (event.completed) return false
    const eventTime = utcToZonedTime(parseISO(event.end_time || event.start_time), "Asia/Kolkata")
    return eventTime < new Date()
  }

  const formatDate = (dateString: string) => {
    const date = utcToZonedTime(parseISO(dateString), "Asia/Kolkata")
    return format(date, "dd/MM/yyyy HH:mm")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <Button
          onClick={() => {
            setEditingEvent(null)
            resetForm()
            setIsDialogOpen(true)
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-4">Loading events...</div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => {
                const isOverdue = isEventOverdue(event)
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isOverdue ? "bg-red-50" : "bg-gray-50"
                    }`}
                  >
                    <div>
                      <h3 className={`text-lg font-medium ${isOverdue ? "text-red-900" : "text-gray-900"}`}>
                        {event.title}
                        {isOverdue && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Overdue
                          </span>
                        )}
                      </h3>
                      {event.description && (
                        <p className={`text-sm ${isOverdue ? "text-red-500" : "text-gray-500"}`}>{event.description}</p>
                      )}
                      <p className={`text-sm ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                        {formatDate(event.start_time)}
                        {event.end_time && ` - ${formatDate(event.end_time)}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                          event.type === "class"
                            ? "bg-blue-100 text-blue-800"
                            : event.type === "lab"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(event)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleComplete(event.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              {events.length === 0 && <p className="text-center text-gray-500">No events found</p>}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                required
              >
                <option value="class">Class</option>
                <option value="lab">Lab</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setEditingEvent(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addEventMutation.isPending || updateEventMutation.isPending}>
                {editingEvent ? "Update Event" : "Add Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

