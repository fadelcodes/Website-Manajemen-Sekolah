import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../supabase/supabaseClient'

const GradeChartOrtu = ({ siswaId }) => {
  const [gradeData, setGradeData] = useState([])

  useEffect(() => {
    if (siswaId) {
      fetchGradeData()
    }
  }, [siswaId])

  const fetchGradeData = async () => {
    const { data } = await supabase
      .from('grades')
      .select(`
        value,
        type,
        subjects(name),
        created_at
      `)
      .eq('siswa_id', siswaId)
      .order('created_at')

    if (data) {
      // Process data for chart - group by subject and type
      const subjectMap = {}
      
      data.forEach(grade => {
        const subjectName = grade.subjects.name
        if (!subjectMap[subjectName]) {
          subjectMap[subjectName] = {
            subject: subjectName,
            tugas: null,
            uts: null,
            uas: null
          }
        }
        subjectMap[subjectName][grade.type] = grade.value
      })

      const chartData = Object.values(subjectMap)
      setGradeData(chartData)
    }
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={gradeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="subject" 
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="tugas" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Tugas"
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="uts" 
          stroke="#f59e0b" 
          strokeWidth={2}
          name="UTS"
          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="uas" 
          stroke="#10b981" 
          strokeWidth={2}
          name="UAS"
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default GradeChartOrtu