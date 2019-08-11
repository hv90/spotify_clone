
module.exports = {
    get_pl_info: function (reference, pl_number){
        let file = require(reference)
        var id = file["items"][pl_number]["id"]//req.query
        var name = file["items"][pl_number]["name"]
    
        return {id, name}
    },

    get_multi_pl_info: function (reference, destiny, start, end){
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
}

function repeatedFilesFinder(){
  var reference = require("./playlists/pumpkins.json")
  
  for (var i = 0; i < reference["info"].length; i++){
    console.log(reference["info"][i].pl_name)
  } 
}

repeatedFilesFinder()
  
  
  
  