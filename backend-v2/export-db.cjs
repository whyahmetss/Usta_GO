const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const DB_URL = 'postgresql://usta_qxwq_user:Rge0VqZogvmZZOb5FgSLptpQyJnAG2Ft@dpg-d6o7cgn5gffc73800tl0-a.frankfurt-postgres.render.com/usta_qxwq'

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } }
})

async function main() {
  try {
    console.log('Connecting to DB...')
    
    const users = await prisma.user.findMany()
    console.log(`Users: ${users.length}`)
    
    const jobs = await prisma.job.findMany()
    console.log(`Jobs: ${jobs.length}`)
    
    const services = await prisma.service.findMany()
    console.log(`Services: ${services.length}`)
    
    const reviews = await prisma.review.findMany()
    console.log(`Reviews: ${reviews.length}`)

    const offers = await prisma.offer.findMany()
    console.log(`Offers: ${offers.length}`)

    const certificates = await prisma.userCertificate.findMany()
    console.log(`Certificates: ${certificates.length}`)

    const notifications = await prisma.notification.findMany()
    console.log(`Notifications: ${notifications.length}`)

    const messages = await prisma.message.findMany()
    console.log(`Messages: ${messages.length}`)

    const transactions = await prisma.transaction.findMany()
    console.log(`Transactions: ${transactions.length}`)

    const coupons = await prisma.coupon.findMany()
    console.log(`Coupons: ${coupons.length}`)

    const campaigns = await prisma.campaign.findMany()
    console.log(`Campaigns: ${campaigns.length}`)

    const complaints = await prisma.complaint.findMany()
    console.log(`Complaints: ${complaints.length}`)

    let bakiyeTalepleri = []
    try { bakiyeTalepleri = await prisma.bakiyeTalebi.findMany() } catch {}
    console.log(`BakiyeTalepleri: ${bakiyeTalepleri.length}`)

    let supportSessions = []
    try { supportSessions = await prisma.supportSession.findMany() } catch {}
    console.log(`SupportSessions: ${supportSessions.length}`)

    const backup = {
      exportedAt: new Date().toISOString(),
      users,
      jobs,
      services,
      reviews,
      offers,
      certificates,
      notifications,
      messages,
      transactions,
      coupons,
      campaigns,
      complaints,
      bakiyeTalepleri,
      supportSessions,
    }

    const outPath = require('path').join(__dirname, 'ustago_backup.json')
    fs.writeFileSync(outPath, JSON.stringify(backup, null, 2))
    console.log(`\nBackup saved to ${outPath}`)
  } catch (e) {
    console.error('ERROR:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
