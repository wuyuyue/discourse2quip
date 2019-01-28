import { discourse, data } from './env.js'

import superagent from 'superagent'

import { json2html, saveImagesMap } from './utils/json2html'

import path from 'path'
import fs from 'fs'

var host = discourse.host
var auth = `?api_key=${discourse.api_key}&api_username=${
  discourse.api_username
}`

var dataDir = data.root

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir)
}

async function fetchCategory() {
  try {
    var categories = await superagent
      .get(`${host}/categories.json${auth}`)
      .then(res => {
        return res.body.category_list.categories
      })
    return categories
  } catch (e) {
    console.log(e)
    return null
  }
}

async function fetchTopicList(cid) {
  var result = []
  try {
    var currentPage = 0
    var allPages = 1
    while (allPages > currentPage) {
      try {
        var lists = await superagent
          .get(`${host}/c/${cid}.json${auth}&page=${currentPage}`)
          .then(res => {
            if (res.body.topic_list.more_topics_url) {
              allPages++
              currentPage++
            } else {
              currentPage++
            }
            return res.body.topic_list.topics
          })
        result = result.concat(lists)
      } catch (e) {
        console.log(e)
      }
    }
    return result
  } catch (e) {
    console.log(e)
    return null
  }
}

async function fetchTopicDetail(id) {
  try {
    var result = await superagent
      .get(`${host}/t/${id}.json${auth}`)
      .then(res => {
        return res.body
      })
    return result
  } catch (e) {
    console.log(e)
    return null
  }
}

async function main() {
  var categories = await fetchCategory()

  if (categories) {
    for (var i = 0; i < categories.length; i++) {
      var c = categories[i]
      var cid = c.id
      var folder = dataDir + '/' + c.name
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
      }
      console.log('create folder ' + folder)
      var lists = await fetchTopicList(cid)

      for (var j = 0; j < lists.length; j++) {
        var d = lists[j]
        var data = await fetchTopicDetail(d.id)
        var title = data.title
        console.log(title)
        var subFolder = path.join(
          folder,
          title
            .replace('/', '-')
            .replace(':', '')
            .replace('：', '')
        )
        if (!fs.existsSync(subFolder)) {
          fs.mkdirSync(subFolder)
        }
        var jsonFileName = path.join(subFolder, 'data.json')
        fs.writeFileSync(jsonFileName, JSON.stringify(data, 0, 4))

        await json2html(subFolder, data)
      }
    }
    saveImagesMap()
  }
}

main()
