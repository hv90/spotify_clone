

function get_pl_info (pl_source, pl_number){
  let file = require(pl_source)
  var id = file["items"][pl_number]["id"]//req.query
  var name = file["items"][pl_number]["name"]
  
  return {id, name}
}

function get_multi_pl_info (reference, destiny, start, end){
  var info = {"info": []} 
  var start = start
  var end = end

  fs.readFile(reference, (err, data)=>{
    if(err) throw err
    var data = JSON.parse(data)

    for(var i = start; i < end; i++){
      var pl_name = data["items"][i]["name"]
      var uri = data["items"][i]["id"]
      info["info"].push({pl_name, uri })  
    }

    fs.writeFile(destiny, JSON.stringify(info), err =>{
      if(err) throw err
    }) 
  })
}

function repeatedFilesFinder(path1, path2){
  var A = require(path1)
  var B = require(path2)
  var result = []


  //console.log(A["items"][1]["track"]["uri"])
  for (var i = 0; i < A["items"].length; i++){
    for( var j = 0; j < B["items"].length; j++){
      if(A["items"][i]["track"]["id"] == B["items"][j]["track"]["id"]){
        data = {
          "uri": A["items"][i]["track"]["uri"]
        }
        console.log(A["items"][i]["track"]["name"])
        result.push(data)
      }
    }
  }
  return result
}


//repeatedFilesFinder(".//playlists//Blue Pumpkins.json", ".//playlists//Purple Pumpkins.json")
  
  
module.exports = {get_pl_info, get_multi_pl_info, repeatedFilesFinder}


