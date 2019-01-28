import { data, quip } from './env.js'

import superagent from 'superagent'
import { JSDOM } from 'jsdom'

import { img2base64 } from './utils/img2base64'
import path from 'path'
import fs from 'fs'

var sourceDir = data.root
var quipDir = quip.root
var allMaps = {}
let imagesMap = {}
function saveAllMaps() {
  fs.writeFileSync(
    path.join(sourceDir, 'map.json'),
    JSON.stringify(allMaps, 0, 4)
  )
}

function loadAllMaps() {
  if (fs.existsSync(path.join(sourceDir, 'map.json'))) {
    var data = fs.readFileSync(path.join(sourceDir, 'map.json'))
    allMaps = JSON.parse(data)
  }
}

function loadImagesMap() {
  if (fs.existsSync(path.join(sourceDir, 'images.json'))) {
    var data = fs.readFileSync(path.join(sourceDir, 'images.json'))
    imagesMap = JSON.parse(data)
  }
}

async function createFolder(name, parent_id) {
  console.log(`create folder ${name}`)
  try {
    var data = await superagent
      .post(`${quip.host}/1/folders/new`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Authorization', `Bearer ${quip.access_token}`)
      .send({ title: name, parent_id: parent_id })
      .then(res => {
        return res.body
      })
    return data
  } catch (e) {
    console.log(e)
    return null
  }
}

async function createDocument(title, content, parent_id) {
  console.log(`create document ${title}`)
  try {
    var data = await superagent
      .post(`${quip.host}/1/threads/new-document`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Authorization', `Bearer ${quip.access_token}`)
      .send({ title: title, content: content, member_ids: parent_id })
      .then(res => {
        return res.body
      })
    return data
  } catch (e) {
    console.log(e)
    return null
  }
}

async function updateDocument(id, sectionId, title, content) {
  console.log(`update document ${id} ${title} ${sectionId}`)
  try {
    var data = await superagent
      .post(`${quip.host}/1/threads/edit-document`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Authorization', `Bearer ${quip.access_token}`)
      .send({
        content: content,
        thread_id: id,
        location: 4,
        section_id: sectionId
      })
      .then(res => {
        return res.body
      })
    return data
  } catch (e) {
    console.log(e)
    return null
  }
}

async function uploadImage(blob, id) {
  console.log(`update image for thread ${id}`)
  try {
    var data = await superagent
      .post(`${quip.host}/1/blob/${id}`)
      .set('Authorization', `Bearer ${quip.access_token}`)
      .attach('blob', blob)
      .then(res => {
        return res.body
      })
    return data
  } catch (e) {
    console.log(e)
    return null
  }
}

async function main() {
  var uploadFlag = false
  try {
    loadAllMaps()
    loadImagesMap()
    var quipDirId = null
    if (allMaps[quipDir] && allMaps[quipDir].id) {
      quipDirId = allMaps[quipDir].id
    } else {
      var rd = await createFolder(quipDir, quip.parent_id)
      // console.log(d)
      if (!rd || !rd.folder.id) {
        console.log(`create folder ${quipDir} failed`)
        return
      }
      quipDirId = rd.folder.id
      console.log(quipDirId)
      allMaps[quipDir] = {
        ...allMaps[quipDir],
        id: quipDirId
      }
      // console.log(allMaps)
    }

    var dirs = fs.readdirSync(sourceDir)
    for (var i = 0; i < dirs.length; i++) {
      var dir = dirs[i]
      var stat = fs.statSync(path.join(sourceDir, dir))
      if (!stat.isDirectory()) continue

      var folderId = null
      if (allMaps[dir] && allMaps[dir].id) {
        folderId = allMaps[dir].id
      } else {
        var d = await createFolder(dir, quipDirId)
        // console.log(d)
        if (!d || !d.folder.id) {
          console.log(`create folder ${dir} failed`)
          break
        }
        folderId = d.folder.id
        console.log(folderId)
        allMaps[dir] = {
          ...allMaps[dir],
          id: folderId
        }
        // console.log(allMaps)
      }
      var topics = fs.readdirSync(path.join(sourceDir, dir))
      for (var j = 0; j < topics.length; j++) {
        var topic = topics[j]
        var content = fs
          .readFileSync(path.join(sourceDir, dir, topic, 'data.html'))
          .toString()

        // hack for quip small iamge problem

        const dom = new JSDOM(content)
        var document = dom.window.document
        var imgs = document.querySelectorAll('img')
        for (var k = 0; k < imgs.length; k++) {
          var url = imgs[k].getAttribute('src')
          if (!imagesMap[url]) continue
          var width = imgs[k].getAttribute('width') || imgs[k].style.width
          var height = imgs[k].getAttribute('height') || imgs[k].style.height
          if (parseInt(width) < 100 && parseInt(height) < 100) {
            var newElement = document.createElement('div')
            newElement.style.display = 'inline-block'
            newElement.style.width = width + 'px'
            newElement.style.height = height + 'px'
            var base64 = await img2base64(imagesMap[url])
            if (!base64) continue
            newElement.style.backgroundImage = 'url(' + base64 + ')'
            var parentNode = imgs[k].parentNode
            // console.log(parentNode.innerHTML)
            parentNode.replaceChild(newElement, imgs[k])
            // console.log(parentNode.innerHTML)
          }
        }

        var threadId = null
        var threadHtml = null
        var beforeHtml = null
        // var rootSectionId = null
        if (allMaps[path.join(dir, topic)]) {
          threadId = allMaps[path.join(dir, topic)].id
          // rootSectionId = allMaps[path.join(dir, topic)].section
          threadHtml = allMaps[path.join(dir, topic)].html
          beforeHtml = allMaps[path.join(dir, topic)].beforeHtml
        } else {
          var td = await createDocument(
            topic,
            document.querySelector('body').innerHTML,
            folderId
          )
          // console.log(td)
          if (!td || !td.thread.id) {
            console.log(`create document ${topic} failed`)
            break
          }
          threadId = td.thread.id
          threadHtml = td.html
          beforeHtml = document.querySelector('body').innerHTML
          // console.log(td.html)
          // rootSectionId = new JSDOM(td.html).window.document.querySelector('p').id

          // console.log(rootSectionId)
        }

        allMaps[path.join(dir, topic)] = {
          ...allMaps[path.join(dir, topic)],
          id: threadId,
          // beforeHtml: beforeHtml,
          html: threadHtml
        }
        // const dom = new JSDOM(content)
        // var document = dom.window.document
        // var imgs = document.querySelectorAll('img')
        // for (var k = 0; k < imgs.length; k++) {
        //   if (uploadFlag) break
        //   var url = imgs[k].getAttribute('src')
        //   if (!imagesMap[url]) continue
        //   console.log(imagesMap[url])
        //   var quipAttachment = null
        //   if (allMaps[imagesMap[url]]) {
        //     quipAttachment = allMaps[imagesMap[url]]
        //   } else {
        //     var blob = fs.readFileSync(imagesMap[url])
        //     quipAttachment = await uploadImage(imagesMap[url], threadId)
        //   }
        //   allMaps[imagesMap[url]] = {
        //     ...allMaps[imagesMap[url]],
        //     ...quipAttachment
        //   }
        //   uploadFlag = true
        //   imgs[k].setAttribute('src', quipAttachment.url)
        //   try {
        //   } catch (e) {
        //     console.log(e)
        //   }
        // }
        // var a = await updateDocument(
        //   threadId,
        //   threadId,
        //   topic,
        //   document.querySelector('body').innerHTML
        // )
        // console.log(a)
        // // content = document.querySelector('body').innerHTML
        //
        // break
      }
      // break
    }
  } catch (e) {
    console.log(e)
  } finally {
    saveAllMaps()
  }
}

// superagent
//   .get(`${quip.host}/1/threads/?ids=cMVAAAfKXbA`)
//   .set('Authorization', `Bearer ${quip.access_token}`)
//   .then(res => {
//     console.log(res.body)
//     return res.body
//   })
//   .catch(e => {
//     console.log(e)
//   })

main()
