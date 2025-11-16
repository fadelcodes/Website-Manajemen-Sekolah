import { useState, useEffect } from 'react'
import { supabase } from '../supabase/supabaseClient'

export const useRealtime = (table, callback, filter = {}) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table, ...filter },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table, callback, filter])
}