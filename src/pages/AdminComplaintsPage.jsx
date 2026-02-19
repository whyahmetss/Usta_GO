import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

function AdminComplaintsPage() {
  const navigate = useNavigate()
  const [allComplaints, setAllComplaints] = useState([])
  const [filter, setFilter] = useState('open') // open, resolved, rejected, all

  useEffect(() => {
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]')
    const complaints = jobs
      .filter(j => j.complaint)
      .map(job => ({
        ...job.complaint,
        jobId: job.id,
        jobTitle: job.title,
        customerName: job.customer.name,
        professionalName: job.professional?.name || 'Usta'
      }))
    setAllComplaints(complaints)
  }, [])

  const handleResolveComplaint = (jobId) => {
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]')
    const updatedJobs = jobs.map(j =>
      j.id === jobId && j.complaint
        ? { ...j, complaint: { ...j.complaint, status: 'resolved' } }
        : j
    )
    localStorage.setItem('jobs', JSON.stringify(updatedJobs))
    setAllComplaints(prev =>
      prev.map(c => c.jobId === jobId ? { ...c, status: 'resolved' } : c)
    )
    alert('Şikayet çözüldü!')
  }

  const handleRejectComplaint = (jobId) => {
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]')
    const updatedJobs = jobs.map(j =>
      j.id === jobId && j.complaint
        ? { ...j, complaint: { ...j.complaint, status: 'rejected' } }
        : j
    )
    localStorage.setItem('jobs', JSON.stringify(updatedJobs))
    setAllComplaints(prev =>
      prev.map(c => c.jobId === jobId ? { ...c, status: 'rejected' } : c)
    )
    alert('Şikayet reddedildi!')
  }

  const filtered = filter === 'all'
    ? allComplaints
    : allComplaints.filter(c => c.status === filter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Şikayet Yönetimi</h1>
            <p className="text-sm text-gray-500">Toplam {allComplaints.length} şikayet</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['open', 'resolved', 'rejected', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              {status === 'open' ? '📋 Açık' : status === 'resolved' ? '✅ Çözüldü' : status === 'rejected' ? '❌ Reddedildi' : '📊 Tümü'}
              {status !== 'all' && ` (${allComplaints.filter(c => c.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Complaints List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-gray-600 text-lg">Gösterilecek şikayet yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((complaint, idx) => (
              <div key={idx} className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${
                complaint.status === 'resolved' ? 'border-green-500' :
                complaint.status === 'rejected' ? 'border-red-500' :
                'border-yellow-500'
              }`}>
                <div className="grid grid-cols-3 gap-6 mb-4">
                  {/* Info */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Şikayet Detayları</h3>
                    <div className="space-y-2">
                      <p><span className="text-gray-600">Müşteri:</span> <strong>{complaint.customerName}</strong></p>
                      <p><span className="text-gray-600">Usta:</span> <strong>{complaint.professionalName}</strong></p>
                      <p><span className="text-gray-600">İş:</span> <strong>{complaint.jobTitle}</strong></p>
                      <p><span className="text-gray-600">Neden:</span> <strong>{complaint.reason}</strong></p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Açıklama</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {complaint.details || 'Detaylı açıklama yok'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(complaint.filedAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Status & Actions */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Durum & İşlem</h3>
                    <div className={`px-3 py-2 rounded-lg mb-3 text-center font-bold ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      complaint.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {complaint.status === 'open' ? '📋 Açık' : complaint.status === 'resolved' ? '✅ Çözüldü' : '❌ Reddedildi'}
                    </div>

                    {complaint.status === 'open' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveComplaint(complaint.jobId)}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-1 text-sm"
                        >
                          <CheckCircle size={16} /> Çöz
                        </button>
                        <button
                          onClick={() => handleRejectComplaint(complaint.jobId)}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition flex items-center justify-center gap-1 text-sm"
                        >
                          <XCircle size={16} /> Reddet
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminComplaintsPage
