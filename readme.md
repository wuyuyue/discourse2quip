####run
  ```
  npm i

  cp  env.js.sample env.js & vi env.js // init setting which is required

        module.exports = {
          discourse: {
            host: 'https://meta.discoursecn.org',
            api_key: '*',
            api_username: '*'
          },
          data: {
            root: './data' // local storage path for discourse-export output and quip-import input
          },
          quip: {
            host: 'https://platform.quip.com',
            accessToken: '*',
            root: 'bbs',
            parent_id: '*'

          }
        }


  npm run export //export from discourse

  npm run import // import to quip

  ```




####discourse webapi export detail

* document: https://docs.discourse.org/

* need api-key in your bbs website under path /admin/api/keys;

    * DiscourseApi::TooManyRequests: {“errors”=>[“You’ve performed this action too many times. Please wait 47秒 before trying again.”], “error_type”=>“rate_limit”, “extras”=>{“wait_seconds”=>47}}

    there is still rate_limit for request（weired setting for api-key, failed to find place to close）

* http get
categories list：/categories.json

* thread list under a category： /c/[cid].json
  * need to fetch each pages（pageSize is 30）, more_topics_url which shows there are still pages
* thread detail: /t/[id].json

  * need to save all imgs under the thread incase the url would be invalid if bbs would get offline

####quip  webapi import detail

  * Quip Access Token (required)

    * how to get token https://quip.com/dev/token

  * create folder
    * https://quip.com/dev/automation/documentation#folders-post

  * upload file to folder
    * https://quip.com/dev/automation/documentation#document-post
    * error 414 Request-URI Too Large:

        if your html file is too big(for example, you included a lot of base64 images)  you would meet error 414 Request-URI Too Large。。。
    https://quip.com/dev/automation/documentation#blob-post

    * quip do backend handle for upload html.

        if your html contains img, which would be upload as blob to quip.
  but wired thing is that if the img is too small, it would be failed with an empty placeholder in document; also all img could not set size
