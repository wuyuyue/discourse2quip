import { JSDOM } from 'jsdom'
import superagent from 'superagent'

import { discourse, data } from '../env.js'
import path from 'path'
import fs from 'fs'

var host = discourse.host
var auth = `?api_key=${discourse.api_key}&api_username=${
  discourse.api_username
}`

var dataDir = data.root

var imagesMap = {}

export function saveImagesMap() {
  fs.writeFileSync(dataDir + '/images.json', JSON.stringify(imagesMap, null, 4))
}

async function saveImage(url) {
  var blob = await superagent
    .get(url)
    .responseType('blob')
    .then(res => {
      return res.body
    })
  // console.log(blob);
  return blob
}

export async function json2html(folder, data) {
  var title = data.title
  var content = ''
  var posts = data.post_stream.posts

  var mainPost = posts[0]
  var responsPosts = posts.splice(1)

  content += '<body><div>'
  content += '<h3>' + title + '</h3>'
  content += '<o>'
  content +=
    '<div>1 楼 ' +
    mainPost.name +
    ' posted at ' +
    mainPost.updated_at +
    '(last updated at' +
    mainPost.updated_at +
    ')' +
    '</div>'

  content += '<p>' + mainPost.cooked + '</p><hr/>'

  for (var i = 0; i < responsPosts.length; i++) {
    var responsPost = responsPosts[i]
    content +=
      '<div>' +
      (i + 2) +
      '楼 ' +
      responsPost.name +
      ' responsed at ' +
      responsPost.updated_at +
      '(last updated at' +
      responsPost.updated_at +
      ')' +
      '<div>'
    content += '<p>' + responsPost.cooked + '</p><hr/>'
  }
  content += '</p>'
  content += '</body>'

  const dom = new JSDOM(content)
  var document = dom.window.document

  var imgs = document.querySelectorAll('img')

  for (var i = 0; i < imgs.length; i++) {
    var url = imgs[i].getAttribute('src')
    if (!url) continue
    try {
      url = url.replace('http:', '').replace('https:', '')
      url = 'http:' + url
      imgs[i].setAttribute('src', url)
      var blob = await saveImage(url)
      var type = url.match(/(.png|.jpeg|.jpg|.bmp)/)[1]
      if (!type) continue
      var file = path.join(folder, new Date().getTime() + type)
      imagesMap[url] = file
      console.log(url)

      fs.writeFileSync(file, blob)
    } catch (e) {
      console.log(e)
      continue
    }
  }

  content = document.querySelector('body').innerHTML

  fs.writeFileSync(path.join(folder, 'data.html'), content)
}

// async function test(){
//   var id = 392
//   var result = await superagent.get(`${host}/t/${id}.json${auth}`).then(res=>{ return res.body })
//
//   await json2html("./",result);
//
//   saveImagesMap()
// }
//
// test()
