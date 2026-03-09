import * as configService from '../services/config.service.js'

export const getCancellationRates = async (req, res) => {
  try {
    const rates = await configService.getCancellationRates()
    res.json({ success: true, data: rates })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

export const setCancellationRates = async (req, res) => {
  try {
    const { pending, accepted, inProgress } = req.body || {}
    const rates = await configService.setCancellationRates({ pending, accepted, inProgress })
    res.json({ success: true, data: rates })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

export const getReferralBonus = async (req, res) => {
  try {
    const bonus = await configService.getReferralBonus()
    res.json({ success: true, data: bonus })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

export const setReferralBonus = async (req, res) => {
  try {
    const { referrerBonus, newUserBonus } = req.body || {}
    const bonus = await configService.setReferralBonus({ referrerBonus, newUserBonus })
    res.json({ success: true, data: bonus })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}
