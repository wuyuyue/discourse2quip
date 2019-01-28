import fs from 'fs'
export async function img2base64(path) {
  console.log(path, 'change small pic which below 100*100 to base64')
  var result = fs.readFileSync(path).toString('base64')
  var type = path.match(/(png|jpeg|jpg|bmp|gif)/)[1]
  if (!type) return null
  return 'data:image/' + type + ';base64,' + result
}
