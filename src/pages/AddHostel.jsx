// AddHostel.jsx — Two-step flow: Step 1 = hostel+rooms, Step 2 = upload images
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '../api/axios'
import ImageUploader from '../components/ImageUploader'
import Footer from '../components/Footer'
import '../styles/Forms.css'

const ROOM_TYPES     = ['single', 'double', 'triple']
const GENDER_OPTIONS = ['male', 'female', 'co-ed']

function AddHostel() {
  const navigate = useNavigate()
  const [submitting,      setSubmitting]      = useState(false)
  const [serverError,     setServerError]     = useState('')
  const [serverSuccess,   setServerSuccess]   = useState('')
  const [createdHostelId, setCreatedHostelId] = useState(null)
  const [step,            setStep]            = useState(1) // 1=form, 2=photos

  const {
    register,
    handleSubmit,
    control,
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

  useEffect(() => { document.title = 'Add Hostel — Nestora' }, [])

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      setServerError('')

      // ── STEP 1: Create hostel ─────────────────────────────────────────────
      const hostelRes  = await api.post('/api/hostels', {
        hostel_name:   data.hostel_name.trim(),
        description:   data.description?.trim() || '',
        gender:        data.gender,
        contact_phone: data.contact_phone?.trim() || null,
        city:          data.city.trim(),
        area:          data.area.trim(),
        address:       data.address.trim(),
      })
      const hostelInner = hostelRes.data?.data || hostelRes.data || {}
      const hostelData  = hostelInner.hostel || hostelInner
      const hostelId    = hostelData?.hostel_id || hostelData?.id

      if (!hostelId) throw new Error('No hostel_id received from server.')

      // ── STEP 2: Create rooms ──────────────────────────────────────────────
      for (const room of data.rooms) {
        if (!room.rent) continue
        await api.post(`/api/rooms/hostel/${hostelId}`, {
          room_type:      room.room_type,
          rent:           Number(room.rent),
          capacity:       Number(room.capacity) || 1,
          available_beds: Number(room.available_beds) || 0,
        })
      }

      // ── STEP 3: Go to photo upload step ──────────────────────────────────
      setCreatedHostelId(hostelId)
      setStep(2)
      setServerSuccess('✅ Hostel created! Now add photos (optional).')
    } catch (err) {
      setServerError(err.message || 'Failed to create hostel.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Step 2: Image upload ──────────────────────────────────────────────────
  if (step === 2 && createdHostelId) {
    return (
      <div className="form-page">
        <div className="form-page-header">
          <div className="form-page-header-inner">
            <div>
              <h1>📷 Add Photos</h1>
              <p>Upload photos of your hostel to attract more guests</p>
            </div>
          </div>
        </div>

        <div className="form-container">
          {serverSuccess && <div className="alert alert-success">{serverSuccess}</div>}

          <div style={{ marginBottom: 24, padding: 24, background: '#F8FAFC', borderRadius: 12, border: '1.5px solid #E2E8F0' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>📸 Upload Hostel Photos</div>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
              Good photos attract 3× more enquiries. Upload up to 10 images (JPG, PNG, WebP).
              You can always manage photos later from your dashboard.
            </p>
            <ImageUploader
              hostelId={createdHostelId}
              onUploadComplete={() => {}}
              existingCount={0}
            />
          </div>

          <div className="form-submit-bar">
            <div className="form-submit-bar-note">Photos are optional — skip to add from Dashboard later.</div>
            <div className="form-submit-bar-actions">
              <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                Skip for now
              </button>
              <button
                id="finish-listing-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/dashboard')}
              >
                ✅ Finish & Go to Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // ── Step 1: Hostel + rooms form ───────────────────────────────────────────
  return (
    <div className="form-page">
      <div className="form-page-header">
        <div className="form-page-header-inner">
          <div>
            <h1>➕ Add New Hostel</h1>
            <p>Fill in the details below to list your property on Nestora</p>
          </div>
          <Link to="/dashboard" className="form-page-back">← Back to Dashboard</Link>
        </div>
      </div>

      <div className="form-container">
        {serverSuccess && <div className="alert alert-success" role="status">{serverSuccess}</div>}
        {serverError   && <div className="alert alert-error"  role="alert">⚠️ {serverError}</div>}

        <form id="add-hostel-form" onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── SECTION 1: Basic Info ── */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="form-section-icon">📋</div>
              <div>
                <div className="form-section-title">Basic Information</div>
                <div className="form-section-sub">Name, description, and contact details</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="hostel-name">Hostel Name *</label>
              <input id="hostel-name" type="text" className="form-input"
                placeholder="e.g. Sunrise Boys Hostel"
                {...register('hostel_name', {
                  required: 'Hostel name is required',
                  minLength: { value: 3, message: 'Min 3 characters' },
                })} />
              {errors.hostel_name && <p className="form-error">⚠️ {errors.hostel_name.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="hostel-description">Description</label>
              <textarea id="hostel-description" className="form-textarea" rows={4}
                placeholder="Describe meals, security, amenities, nearby landmarks..."
                {...register('description')} />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="hostel-gender">Gender *</label>
                <select id="hostel-gender" className="form-select"
                  {...register('gender', { required: 'Please select gender' })}>
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
                <label className="form-label" htmlFor="hostel-phone">Contact Phone *</label>
                <input id="hostel-phone" type="tel" className="form-input"
                  placeholder="10-digit mobile number"
                  {...register('contact_phone', {
                    required: 'Contact phone is required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit number' },
                  })} />
                {errors.contact_phone && <p className="form-error">⚠️ {errors.contact_phone.message}</p>}
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Location ── */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="form-section-icon">📍</div>
              <div>
                <div className="form-section-title">Location</div>
                <div className="form-section-sub">Where is your hostel located?</div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="hostel-city">City *</label>
                <input id="hostel-city" type="text" className="form-input"
                  placeholder="e.g. Bangalore"
                  {...register('city', { required: 'City is required' })} />
                {errors.city && <p className="form-error">⚠️ {errors.city.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="hostel-area">Area / Locality *</label>
                <input id="hostel-area" type="text" className="form-input"
                  placeholder="e.g. Koramangala"
                  {...register('area', { required: 'Area is required' })} />
                {errors.area && <p className="form-error">⚠️ {errors.area.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="hostel-address">Full Address *</label>
              <textarea id="hostel-address" className="form-textarea" rows={3}
                placeholder="Building, Street, Landmark, City, PIN"
                {...register('address', { required: 'Full address is required' })} />
              {errors.address && <p className="form-error">⚠️ {errors.address.message}</p>}
            </div>
          </div>

          {/* ── SECTION 3: Rooms ── */}
          <div className="form-section-card">
            <div className="form-section-header">
              <div className="form-section-icon">🛏️</div>
              <div>
                <div className="form-section-title">Room Types &amp; Pricing</div>
                <div className="form-section-sub">Add all available room configurations</div>
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
              gap: 12, paddingBottom: 8,
              fontWeight: 600, fontSize: '0.75rem',
              color: 'var(--text-secondary)', textTransform: 'uppercase',
            }} className="room-row-header">
              <span>Room Type</span>
              <span>Rent (₹/month)</span>
              <span>Capacity</span>
              <span>Available Beds</span>
              <span></span>
            </div>

            {roomFields.map((field, index) => (
              <div className="room-row" key={field.id}>
                <select id={`room-type-${index}`} className="form-select"
                  {...register(`rooms.${index}.room_type`, { required: true })}>
                  {ROOM_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t === 'single' ? '🛏️ Single' : t === 'double' ? '🛏️ Double' : '🛏️ Triple'}
                    </option>
                  ))}
                </select>

                <input id={`room-rent-${index}`} type="number" className="form-input"
                  placeholder="e.g. 5000" min="0"
                  {...register(`rooms.${index}.rent`, {
                    required: 'Required',
                    min: { value: 1, message: 'Min ₹1' },
                  })} />

                <input id={`room-capacity-${index}`} type="number" className="form-input"
                  placeholder="1" min="1" max="10"
                  {...register(`rooms.${index}.capacity`, { min: 1 })} />

                <input id={`room-beds-${index}`} type="number" className="form-input"
                  placeholder="0" min="0"
                  {...register(`rooms.${index}.available_beds`, { min: 0 })} />

                <button type="button" className="room-row-remove"
                  onClick={() => removeRoom(index)}
                  disabled={roomFields.length === 1} aria-label="Remove room">✕</button>
              </div>
            ))}

            <button type="button" id="add-room-btn" className="add-room-btn"
              onClick={() => appendRoom({ room_type: 'single', rent: '', capacity: 1, available_beds: 1 })}>
              ➕ Add Another Room Type
            </button>
          </div>

          {/* Submit Bar */}
          <div className="form-submit-bar">
            <div className="form-submit-bar-note">
              📸 Photos can be added in the next step after saving.
            </div>
            <div className="form-submit-bar-actions">
              <Link to="/dashboard" className="btn btn-outline">Cancel</Link>
              <button id="create-listing-btn" type="submit"
                className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? '⏳ Creating...' : '🚀 Next: Add Photos →'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}

export default AddHostel
