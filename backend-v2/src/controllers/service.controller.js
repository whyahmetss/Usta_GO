import * as serviceService from '../services/service.service.js'
import { successResponse } from '../utils/response.js'

export const getServices = async (req, res, next) => {
  try {
    const services = await serviceService.getAllServices()
    successResponse(res, services)
  } catch (err) { next(err) }
}

export const createService = async (req, res, next) => {
  try {
    const { category, label, basePrice, homeCategory } = req.body
    if (!category || basePrice === undefined) {
      return res.status(400).json({ error: 'category ve basePrice zorunlu' })
    }
    const service = await serviceService.createService({ category, label, basePrice, homeCategory })
    successResponse(res, service, 'Servis oluşturuldu', 201)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Bu kategori zaten mevcut' })
    }
    next(err)
  }
}

export const updateService = async (req, res, next) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body)
    successResponse(res, service, 'Servis güncellendi')
  } catch (err) { next(err) }
}

export const deleteService = async (req, res, next) => {
  try {
    await serviceService.deleteService(req.params.id)
    successResponse(res, null, 'Servis silindi')
  } catch (err) { next(err) }
}
