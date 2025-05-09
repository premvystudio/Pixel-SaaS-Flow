import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '../../../lib/redis'
import { DesignRepository } from '../../../lib/design-repository'
import { getAuth } from '@clerk/nextjs/server'

export const runtime = 'edge'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const auth = await getAuth(req)
    if (!auth?.userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const body = await req.json()
    const { prompt } = body

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid prompt' }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const id = await DesignRepository.createJob(auth.userId, prompt)
    
    return new NextResponse(
      JSON.stringify({ id }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Design creation error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create design' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}