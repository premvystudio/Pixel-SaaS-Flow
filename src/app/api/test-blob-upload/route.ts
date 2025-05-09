import { NextResponse } from 'next/server';
import { StorageService } from '../../../lib/storage-service';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'No file provided' }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await StorageService.uploadFile(buffer, {
      prefix: 'test-uploads',
      filename: file.name,
      addRandomSuffix: true,
    });
    
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        url: result.url,
        id: result.id,
        size: result.size 
      }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error: any) {
    console.error('Upload test error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Upload failed' }), 
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