import request from 'supertest'
import { describe, expect, it } from 'vitest'

process.env.DATABASE_PATH = ':memory:'

const { default: app } = await import('../src/app.js')

describe('GET /health', () => {
  it('should return the server health status', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok'
    })
  })
})

describe('POST /api/v1/memories', () => {
  it('should reject empty content', async () => {
    const response = await request(app).post('/api/v1/memories').send({
      userId: '123456',
      content: '   '
    })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: 'userId and content must be non-empty strings'
    })
  })
})

describe('GET /api/v1/memories/:id', () => {
  it('should reject an invalid memory id', async () => {
    const response = await request(app).get('/api/v1/memories/abc')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: 'Memory id must be a positive integer'
    })
  })
})

describe('Memory creation', () => {
  it('should create and store a memory', async () => {
    const createResponse = await request(app).post('/api/v1/memories').send({
      userId: '  123456  ',
      content: '  User likes testing  '
    })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body).toEqual({
      id: expect.any(Number),
      userId: '123456',
      content: 'User likes testing',
      createdAt: expect.any(String),
      updatedAt: null
    })

    const memoryId = createResponse.body.id

    const getResponse = await request(app).get(`/api/v1/memories/${memoryId}`)

    expect(getResponse.status).toBe(200)
    expect(getResponse.body).toEqual(createResponse.body)
  })
})

describe('Memory update', () => {
  it('should update an existing memory', async () => {
    const createResponse = await request(app).post('/api/v1/memories').send({
      userId: '123456',
      content: 'Original content'
    })

    const memoryId = createResponse.body.id

    const updateResponse = await request(app)
      .patch(`/api/v1/memories/${memoryId}`)
      .send({
        content: 'Updated content'
      })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body).toEqual({
      id: memoryId,
      userId: '123456',
      content: 'Updated content',
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    })

    const getResponse = await request(app).get(`/api/v1/memories/${memoryId}`)

    expect(getResponse.body.content).toBe('Updated content')
    expect(getResponse.body.updatedAt).toEqual(updateResponse.body.updatedAt)
  })
})
