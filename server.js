const express = require('express')
const multer = require('multer')
const { createClient } = require('@supabase/supabase-js')

const app = express()

const upload = multer({ storage: multer.memoryStorage() })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})
app.post('/upload', upload.single('photo'), async (req, res) => {
  const file = req.file

  const fileName = Date.now() + '-' + file.originalname

  const { error } = await supabase.storage
    .from('photos')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    })

  if (error) {
    return res.send(error.message)
  }

  const { data } = supabase.storage
    .from('photos')
    .getPublicUrl(fileName)

  await supabase
    .from('images')
    .insert([
      {
        image_url: data.publicUrl
      }
    ])

  res.redirect('/')
})

app.get('/images', async (req, res) => {
  const { data } = await supabase
    .from('images')
    .select('*')
    .order('id', { ascending: false })

  res.json(data)
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log('server running')
})
