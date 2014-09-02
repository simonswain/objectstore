"use strict";

module.exports = {

  uuid: function(s){

    // s should look like a postgresql uuid
    if(s.length !== 36){
      return false;
    }

    if(s.substr(8,1) !== '-' || s.substr(13,1) !== '-' || s.substr(18,1) !== '-' || s.substr(23,1) !== '-') {
      return false;
    }

    return true;

  }

};
