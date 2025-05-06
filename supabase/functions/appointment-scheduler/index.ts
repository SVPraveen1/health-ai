import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

interface Appointment {
  id: string
  date: string
  time: string
  status: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, date, appointments, appointmentId, userId } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    if (type === 'appointment-scheduling') {
      // AI-powered slot recommendation
      const existingAppointments: Appointment[] = appointments || []
      const requestedDate = new Date(date)
      
      // Default time slots (9 AM to 5 PM)
      const allTimeSlots = Array.from({ length: 9 }, (_, i) => {
        const hour = i + 9
        return `${hour.toString().padStart(2, '0')}:00`
      })

      // Get booked slots for the requested date
      const bookedSlots = existingAppointments
        .filter(apt => 
          apt.date === requestedDate.toISOString().split('T')[0] &&
          apt.status === 'scheduled'
        )
        .map(apt => apt.time)

      // Remove booked slots
      const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot))

      // AI optimization based on patterns and preferences
      const optimizedSlots = await optimizeSlots(availableSlots, requestedDate)

      return new Response(
        JSON.stringify({
          availableSlots: optimizedSlots
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } 
    else if (type === 'schedule-reminder') {
      // Schedule reminder notifications
      const { data: appointment } = await supabaseClient
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single()

      if (!appointment) {
        throw new Error('Appointment not found')
      }

      // Schedule email reminder (24 hours before)
      const reminderDate = new Date(`${appointment.date} ${appointment.time}`)
      reminderDate.setHours(reminderDate.getHours() - 24)

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'appointment_reminder',
          content: `Reminder: You have an appointment (${appointment.title}) tomorrow at ${appointment.time}`,
          scheduled_for: reminderDate.toISOString(),
          status: 'pending'
        })

      return new Response(
        JSON.stringify({ message: 'Reminder scheduled successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid request type')

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function optimizeSlots(availableSlots: string[], date: Date): Promise<string[]> {
  // Here we could add more sophisticated slot optimization logic:
  // 1. Consider historical appointment patterns
  // 2. Take into account user preferences
  // 3. Factor in doctor availability
  // 4. Consider appointment type duration
  // For now, we'll return slots sorted by popularity (morning slots first)
  return availableSlots.sort((a, b) => {
    const timeA = parseInt(a.split(':')[0])
    const timeB = parseInt(b.split(':')[0])
    
    // Prioritize morning slots (9-11)
    if (timeA >= 9 && timeA <= 11) return -1
    if (timeB >= 9 && timeB <= 11) return 1
    
    // Then early afternoon (2-4)
    if (timeA >= 14 && timeA <= 16) return -1
    if (timeB >= 14 && timeB <= 16) return 1
    
    return timeA - timeB
  })
}