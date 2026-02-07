import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'leon@liberture.com'
  const password = 'Liberture2026!' // Strong password for Leon
  const name = 'Leon Acosta'

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    console.log('Admin user already exists!')
    console.log('Email:', email)
    return
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      bosLevel: 10, // Max level for admin
    },
  })

  console.log('✅ Admin user created successfully!')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Name:', name)
  console.log('BOS Level:', user.bosLevel)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
