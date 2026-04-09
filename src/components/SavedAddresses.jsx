import { useState, useEffect } from 'react'
import { MapPin, Home, Briefcase, Plus, Trash2, Check } from 'lucide-react'

const LS_KEY = 'ug_saved_addresses'
const ICONS = { home: Home, work: Briefcase, other: MapPin }
const LABELS = { home: 'Evim', work: 'İş Yerim', other: 'Diğer' }

function getSavedAddresses() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

function saveSavedAddresses(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

export default function SavedAddresses({ onSelect, currentAddress }) {
  const [addresses, setAddresses] = useState(getSavedAddresses)
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('home')
  const [newName, setNewName] = useState('')

  useEffect(() => { saveSavedAddresses(addresses) }, [addresses])

  const handleSaveCurrent = () => {
    if (!currentAddress?.trim()) return
    const entry = { id: Date.now(), type: newLabel, name: newName || LABELS[newLabel], address: currentAddress }
    setAddresses(prev => [...prev, entry])
    setShowAdd(false)
    setNewName('')
  }

  const handleDelete = (id) => {
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  if (addresses.length === 0 && !currentAddress) return null

  return (
    <div className="space-y-2">
      {/* Saved address chips */}
      {addresses.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Kayıtlı Adresler</p>
          {addresses.map(a => {
            const Icon = ICONS[a.type] || MapPin
            const isSelected = currentAddress === a.address
            return (
              <div key={a.id} className="flex items-center gap-2">
                <button
                  onClick={() => onSelect(a.address)}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-accent-500' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isSelected ? 'text-accent-600 dark:text-accent-400' : 'text-gray-700 dark:text-gray-300'}`}>{a.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{a.address}</p>
                  </div>
                  {isSelected && <Check size={14} className="text-accent-500 flex-shrink-0" />}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Save current address */}
      {currentAddress && !addresses.some(a => a.address === currentAddress) && (
        <>
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-[11px] text-primary-500 font-semibold hover:text-primary-600 transition"
            >
              <Plus size={12} /> Bu adresi kaydet
            </button>
          ) : (
            <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                {Object.entries(LABELS).map(([key, label]) => {
                  const BtnIcon = ICONS[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setNewLabel(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                        newLabel === key
                          ? 'bg-primary-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <BtnIcon size={12} /> {label}
                    </button>
                  )
                })}
              </div>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={LABELS[newLabel]}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  İptal
                </button>
                <button onClick={handleSaveCurrent} className="flex-1 py-2 text-xs font-semibold text-white bg-primary-500 rounded-lg active:scale-[0.98]">
                  Kaydet
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
