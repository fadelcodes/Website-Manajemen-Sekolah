import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../supabase/supabaseClient'

const GradeChartSiswa = ({ siswaId }) => {
  const [gradeData, setGradeData] = useState([])
  const [selectedType, setSelectedType] = useState('tugas')

  useEffect(() => {
    if (siswaId) {
      fetchGradeData()
    }
  }, [siswaId, selectedType])

  const fetchGradeData = async () => {
    const { data } = await supabase
      .from('grades')
      .select(`
        value,
        type,
        subjects(name)
      `)
      .eq('siswa_id', siswaId)
      .eq('type', selectedType)

    if (data) {
      // Group by subject and calculate average
      const subjectMap = {}
      data.forEach(grade => {
        const subjectName = grade.subjects.name
        if (!subjectMap[subjectName]) {
          subjectMap[subjectName] = {
            subject: subjectName,
            total: 0,
            count: 0
          }
        }
        subjectMap[subjectName].total += grade.value
        subjectMap[subjectName].count += 1
      })

      const chartData = Object.values(subjectMap).map(item => ({
        subject: item.subject,
        nilai: Math.round((item.total / item.count) * 100) / 100
      }))

      setGradeData(chartData)
    }
  }

  const getColor = (value) => {
    if (value >= 85) return '#10b981'
    if (value >= 75) return '#3b82f6'
    if (value >= 65) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div className="flex space-x-2">
        {['tugas', 'uts', 'uas'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={gradeData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="subject" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [`${value}`, 'Nilai']}
            labelFormatter={(label) => `Mata Pelajaran: ${label}`}
          />
          <Bar dataKey="nilai" radius={[4, 4, 0, 0]}>
            {gradeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.nilai)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Sangat Baik (85-100)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Baik (75-84)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Cukup (65-74)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Kurang (0-64)</span>
        </div>
      </div>
    </div>
  )
}

export default GradeChartSiswa