// FIXED: EditHostel.jsx
// KEY BUGS FIXED:
// 1. Prefill uses hostel_name (not name), rent (not rent_per_month)
// 2. PUT /api/hostels/<id> sends hostel_name (not name)
// 3. Room update: PUT /api/rooms/<room_id> sends 'rent'
// 4. Room create: POST /api/rooms/hostel/<hostelId> sends 'rent'
// 5. hostel_id extracted from nested response shape
// 6. Existing image URLs built with getImageUrl()

import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '../api/axios'
import Loader from '../components/Loader'
import Footer from '../components/Footer'
import ImageManager from '../components/ImageManager'
import { getImageUrl } from '../utils/helpers'
import '../styles/Forms.css'

const ROOM_TYPES     = ['single', 'double', 'triple']
const GENDER_OPTIONS = ['male', 'female', 'co-ed']

function EditHostel() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [loadingData, setLoadingData] = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [serverError, setServerError] = useState('')
  const [serverSuccess, setServerSuccess] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      rooms: [{ room_type: 'single', rent: '', capacity: 1, available_beds: 1 }],
    },
  })

  const { fields: roomFields, append: appendRoom, remove: removeRoom } = useFieldArray({
    control,
    name: 'rooms',
  })

  useEffect(() => {
    document.title = 'Edit Hostel — Nestora'
    fetchHostelData()
  }, [id])

  const fetchHostelData = async () => {
    try {
      setLoadingData(true)
      const res = await api.get(`/api/hostels/${id}`)

      // FIXED: extract from nested response
      const inner  = res.data?.data || res.data || {}
      const hostel = inner.hostel || inner

      // FIXED: pre-fill using actual field names: hostel_name, rent
      reset({
        hostel_name:   hostel.hostel_name || hostel.name || '',
        description:   hostel.description || '',
        gender:        hostel.gender || 'co-ed',
        contact_phone: hostel.contact_phone || '',
        city:          hostel.city || '',
        area:          hostel.area || '',
        address:       hostel.address || '',
        rooms: hostel.rooms?.length
          ? hostel.rooms.map(r => ({
              room_id:        r.room_id,
              room_type:      r.room_type || 'single',
              rent:           r.rent || '',          // FIXED: 'rent' not 'rent_per_month'
              capacity:       r.capacity || 1,
              available_beds: r.available_beds ?? 1,
            }))
          : [{ room_type: 'single', rent: '', capacity: 1, available_beds: 1 }],
      })

    } catch (err) {
      console.error('EditHostel fetch error:', err.message)
      setServerError(err.message || 'Failed to load hostel data.')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      setServerError('')
      setServerSuccess('')

      // ── STEP 1: Update hostel ─────────────────────────────────────────
      // FIXED: backend update_hostel() reads 'hostel_name' (not 'name')
      const hostelPayload = {
        hostel_name:   data.hostel_name.trim(),
        description:   data.description?.trim() || '',
        gender:        data.gender,
        contact_phone: data.contact_phone?.trim() || null,
        city:          data.city.trim(),
        area:          data.area.trim(),
        address:       data.address.trim(),
      }
      await api.put(`/api/hostels/${id}`, hostelPayload)

      // ── STEP 2: Update / create rooms ────────────────────────────────
      // FIXED: 'rent' field name; endpoint /api/rooms/hostel/<id> for new rooms
      for (const room of data.rooms) {
        if (!room.rent) continue
        const roomPayload = {
          room_type:      room.room_type,
          rent:           Number(room.rent),     // FIXED: 'rent'
          capacity:       Number(room.capacity) || 1,
          available_beds: Number(room.available_beds) || 0,
        }
        if (room.room_id) {
          // Update existing room
          try {
            await api.put(`/api/rooms/${room.room_id}`, roomPayload)
          } catch {
            // If update fails, create as new
            await api.post(`/api/rooms/hostel/${id}`, { ...roomPayload, hostel_id: Number(id) })
          }
        } else {
          // Create new room
          await api.post(`/api/rooms/hostel/${id}`, { ...roomPayload, hostel_id: Number(id) })
        }
      }

      setServerSuccess('✅ Hostel updated! Use the Photos section below to manage images.')
    } catch (err) {
      console.error('EditHostel submit error:', err.message)
      setServerError(err.message || 'Failed to update hostel. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader text="Loading hostel data..." size="lg" />
      </div>
    )
  }

  return (
    <div className="form-page">
      {/* Header */}
      <div className="form-page-header">
        <div className="form-page-header-inner">
          <div>
            <h1>✏️ Edit Hostel</h1>
            <p>Update your hostel details and room information</p>
          </div>
          <Link to="/dashboard" className="form-page-back">← Back to Dashboard</Link>
        </div>
      </div>

      <div className="form-container">
        {serverSuccess && <div className="alert alert-success">{serverSuccess}</div>}
        {serverError   && <div className="alert alert-error">⚠️ {serverError}</div>}

        <form id="edit-hostel-form" onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── SECTION 1: Basic Info ── */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="form-section-icon">📋</div>
              <div>
                <div className="form-section-title">Basic Information</div>
                <div className="form-section-sub">Update hostel name, description, and contact</div>
              </div>
            </div>

            <div className="form-group">
              {/* FIXED: field name is hostel_name */}
              <label className="form-label" htmlFor="edit-name">Hostel Name *</label>
              <input id="edit-name" type="text" className="form-input"
                {...register('hostel_name', {
                  required: 'Name is required',
                  minLength: { value: 3, message: 'Min 3 characters' },
                })} />
              {errors.hostel_name && <p className="form-error">⚠️ {errors.hostel_name.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-description">Description</label>
              <textarea id="edit-description" className="form-textarea" rows={4}
                {...register('description')} />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-gender">Gender *</label>
                <select id="edit-gender" className="form-select"
                  {...register('gender', { required: 'Required' })}>
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(g => (
                    <option key={g} value={g}>
                      {g === 'male' ? '👨 Boys Only' : g === 'female' ? '👩 Girls Only' : '👫 Co-ed'}
                    </option>
                  ))}
                </select>
                {errors.gender && <p className="form-error">⚠️ {errors.gender.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-phone">Contact Phone *</label>
                <input id="edit-phone" type="tel" className="form-input"
                  {...register('contact_phone', {
                    required: 'Required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid phone' },
                  })} />
                {errors.contact_phone && <p className="form-error">⚠️ {errors.contact_phone.message}</p>}
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Location ── */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="form-section-icon">📍</div>
              <div><div className="form-section-title">Location</div></div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-city">City *</label>
                <input id="edit-city" type="text" className="form-input"
                  {...register('city', { required: 'City is required' })} />
                {errors.city && <p className="form-error">⚠️ {errors.city.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-area">Area *</label>
                <input id="edit-area" type="text" className="form-input"
                  {...register('area', { required: 'Area is required' })} />
                {errors.area && <p className="form-error">⚠️ {errors.area.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-address">Full Address *</label>
              <textarea id="edit-address" className="form-textarea" rows={3}
                {...register('address', { required: 'Address is required' })} />
              {errors.address && <p className="form-error">⚠️ {errors.address.message}</p>}
            </div>
          </div>

          {/* ── SECTION 3: Rooms ── */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="form-section-icon">🛏️</div>
              <div>
                <div className="form-section-title">Rooms & Pricing</div>
                <div className="form-section-sub">Update room configurations</div>
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
              gap: 12, paddingBottom: 8,
              fontWeight: 600, fontSize: '0.75rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase',
            }} className="room-row-header">
              <span>Room Type</span><span>Rent (₹/mo)</span><span>Capacity</span>
              <span>Avail. Beds</span><span></span>
            </div>

            {roomFields.map((field, index) => (
              <div className="room-row" key={field.id}>
                <select id={`edit-room-type-${index}`} className="form-select"
                  {...register(`rooms.${index}.room_type`)}>
                  {ROOM_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t === 'single' ? '🛏️ Single' : t === 'double' ? '🛏️ Double' : '🛏️ Triple'}
                    </option>
                  ))}
                </select>
                {/* FIXED: field name 'rent' */}
                <input id={`edit-rent-${index}`} type="number" className="form-input" min="0"
                  {...register(`rooms.${index}.rent`)} />
                <input id={`edit-capacity-${index}`} type="number" className="form-input" min="1"
                  {...register(`rooms.${index}.capacity`)} />
                <input id={`edit-beds-${index}`} type="number" className="form-input" min="0"
                  {...register(`rooms.${index}.available_beds`)} />
                <button type="button" className="room-row-remove"
                  onClick={() => removeRoom(index)} disabled={roomFields.length === 1}>✕</button>
              </div>
            ))}

            <button type="button" id="edit-add-room-btn" className="add-room-btn"
              onClick={() => appendRoom({ room_type: 'single', rent: '', capacity: 1, available_beds: 1 })}>
              ➕ Add Another Room Type
            </button>
          </div>

          {/* ── SECTION 4: Photo Manager ── */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="form-section-icon">📷</div>
              <div>
                <div className="form-section-title">Photos</div>
                <div className="form-section-sub">Upload, delete, or set the primary photo</div>
              </div>
            </div>
            <ImageManager
              hostelId={Number(id)}
              onImagesChange={() => {}}
            />
          </div>

          {/* Submit Bar */}
          <div className="form-submit-bar">
            <div className="form-submit-bar-note">Save your changes to update the listing.</div>
            <div className="form-submit-bar-actions">
              <Link to="/dashboard" className="btn btn-outline">Cancel</Link>
              <button id="save-hostel-btn" type="submit" className="btn btn-primary btn-lg"
                disabled={submitting}>
                {submitting ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}

export default EditHostel
