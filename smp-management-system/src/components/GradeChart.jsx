import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const GradeChart = () => {
  // Sample data - replace with real data from Supabase
  const data = [
    { name: 'Kelas 7A', nilai: 85 },
    { name: 'Kelas 7B', nilai: 78 },
    { name: 'Kelas 8A', nilai: 82 },
    { name: 'Kelas 8B', nilai: 75 },
    { name: 'Kelas 9A', nilai: 88 },
    { name: 'Kelas 9B', nilai: 80 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="nilai" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default GradeChart