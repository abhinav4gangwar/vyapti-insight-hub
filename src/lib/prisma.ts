import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Function to find chunk by ID (matching the backend implementation)
export async function findChunkById(targetId: string): Promise<any> {
  try {
    console.log(`Looking for chunk ID: ${targetId}`)

    // Try exact match first using Prisma
    const chunk = await prisma.chunk.findUnique({
      where: {
        chunk_id: targetId
      }
    })

    if (chunk) {
      console.log(`Found exact match: ${chunk.chunk_id}`)

      // Transform the data to match the expected frontend format
      return {
        id: chunk.chunk_id,
        text: chunk.text,
        company_name: chunk.company_name,
        company_ticker: chunk.company_ticker,
        call_date: chunk.call_date,
        fiscal_year: chunk.fiscal_year,
        quarter: chunk.quarter,
        speaker_name: chunk.speaker_name,
        speaker_role: chunk.speaker_role,
        speaker_type: chunk.speaker_type,
        fiscal_period: chunk.fiscal_period,
        created_at: chunk.created_at,
        updated_at: chunk.updated_at
      }
    }

    console.log('No exact match found')
    return null

  } catch (error) {
    console.error('Error querying database:', error)
    throw error
  }
}
