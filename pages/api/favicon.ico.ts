import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Usar uma imagem existente como favicon
    const faviconPath = path.join(process.cwd(), 'public', 'placeholder-logo.png')
    
    if (fs.existsSync(faviconPath)) {
      const favicon = fs.readFileSync(faviconPath)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.send(favicon)
    } else {
      // Retornar um favicon simples em base64
      const simpleFavicon = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      )
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.send(simpleFavicon)
    }
  } catch (error) {
    console.error('Erro ao servir favicon:', error)
    res.status(404).end()
  }
}
