const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const NEW_DB_URL = 'postgresql://neondb_owner:npg_l7K0HyfkBSim@ep-plain-night-anqvht7c-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: { db: { url: NEW_DB_URL } }
})

async function main() {
  const backup = JSON.parse(fs.readFileSync(path.join(__dirname, 'ustago_backup.json'), 'utf-8'))
  console.log('Backup loaded:', backup.exportedAt)

  try {
    // 1. Users
    console.log('\n--- Users ---')
    for (const u of backup.users) {
      try {
        await prisma.user.create({ data: u })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nUsers: ${backup.users.length}`)

    // 2. Services
    console.log('\n--- Services ---')
    for (const s of backup.services) {
      try {
        await prisma.service.create({ data: s })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nServices: ${backup.services.length}`)

    // 3. Jobs
    console.log('\n--- Jobs ---')
    for (const j of backup.jobs) {
      try {
        await prisma.job.create({ data: j })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nJobs: ${backup.jobs.length}`)

    // 4. Offers
    console.log('\n--- Offers ---')
    for (const o of (backup.offers || [])) {
      try {
        await prisma.offer.create({ data: o })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nOffers: ${(backup.offers || []).length}`)

    // 5. Reviews
    console.log('\n--- Reviews ---')
    for (const r of (backup.reviews || [])) {
      try {
        await prisma.review.create({ data: r })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nReviews: ${(backup.reviews || []).length}`)

    // 6. Certificates
    console.log('\n--- Certificates ---')
    for (const c of (backup.certificates || [])) {
      try {
        await prisma.userCertificate.create({ data: c })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nCertificates: ${(backup.certificates || []).length}`)

    // 7. Transactions
    console.log('\n--- Transactions ---')
    for (const t of (backup.transactions || [])) {
      try {
        await prisma.transaction.create({ data: t })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nTransactions: ${(backup.transactions || []).length}`)

    // 8. Messages
    console.log('\n--- Messages ---')
    for (const m of (backup.messages || [])) {
      try {
        await prisma.message.create({ data: m })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nMessages: ${(backup.messages || []).length}`)

    // 9. Notifications
    console.log('\n--- Notifications ---')
    for (const n of (backup.notifications || [])) {
      try {
        await prisma.notification.create({ data: n })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nNotifications: ${(backup.notifications || []).length}`)

    // 10. Coupons
    console.log('\n--- Coupons ---')
    for (const c of (backup.coupons || [])) {
      try {
        await prisma.coupon.create({ data: c })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nCoupons: ${(backup.coupons || []).length}`)

    // 11. Campaigns
    console.log('\n--- Campaigns ---')
    for (const c of (backup.campaigns || [])) {
      try {
        await prisma.campaign.create({ data: c })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nCampaigns: ${(backup.campaigns || []).length}`)

    // 12. Complaints
    console.log('\n--- Complaints ---')
    for (const c of (backup.complaints || [])) {
      try {
        await prisma.complaint.create({ data: c })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nComplaints: ${(backup.complaints || []).length}`)

    // 13. BakiyeTalepleri
    console.log('\n--- BakiyeTalepleri ---')
    for (const b of (backup.bakiyeTalepleri || [])) {
      try {
        await prisma.bakiyeTalebi.create({ data: b })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nBakiyeTalepleri: ${(backup.bakiyeTalepleri || []).length}`)

    // 14. SupportSessions
    console.log('\n--- SupportSessions ---')
    for (const s of (backup.supportSessions || [])) {
      try {
        await prisma.supportSession.create({ data: s })
        process.stdout.write('.')
      } catch (e) { process.stdout.write('x') }
    }
    console.log(`\nSupportSessions: ${(backup.supportSessions || []).length}`)

    console.log('\n\n=== IMPORT COMPLETE ===')
  } catch (e) {
    console.error('\nFATAL ERROR:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
