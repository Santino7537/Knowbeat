// ==============================
// FOLDER
// ==============================
db.createCollection("Folder", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "author_id", "name", "public"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        author_id: {
          bsonType: ["int", "long"],
          description: "'author_id' es la id del usuario que es autor de la carpeta. Campo requerido."
        },
        name: {
          bsonType: "string",
          description: "'name' es el nombre de la carpeta. Campo requerido."
        },
        public: {
          bsonType: "bool",
          description: "'public' indica si la carpeta es pública o no. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// FOLDERPERMISSION
// ==============================
db.createCollection("FolderPermission", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "folder_id", "user_id"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        folder_id: {
          bsonType: "objectId",
          description: "'folder_id' es la id de la carpeta. Campo requerido."
        },
        user_id: {
          bsonType: ["int", "long"],
          description: "'user_id' es la id del usuario que es tiene acceso a la carpeta. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// FILE
// ==============================
db.createCollection("File", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "name", "size", "mime_type"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        name: {
          bsonType: "string",
          description: "'name' es el nombre del archivo en el bucket. Campo requerido."
        },
        size: {
          bsonType: "double",
          description: "'size' es el tamanio (en MB) del archivo. Campo requerido."
        },
        mime_type: {
          bsonType: "string",
          description: "'mime_type' es el tipo de archivo. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// FILERELATION
// ==============================
db.createCollection("FileRelation", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "file_id", "collection", "collection_id"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        file_id: {
          bsonType: "objectId",
          description: "'file_id' es la id del archivo. Campo requerido."
        },
        collection: {
          bsonType: "string",
          description: "'collection' es el nombre de la coleccion. Campo requerido."
        },
        collection_id: {
          bsonType: "objectId",
          description: "'collection_id' es la id del registro que posee el archivo. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// MESSAGE
// ==============================
db.createCollection("Message", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "author_id", "text", "created_at", "seen", "friendship_id"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        author_id: {
          bsonType: ["int", "long"],
          description: "'author_id' es la id del autor del mensaje. Campo requerido."
        },
        text: {
          bsonType: "string",
          maxLength: 4000,
          description: "'text' es el texto del mensaje. Campo requerido."
        },
        created_at: {
          bsonType: "date",
          description: "'created_at' es la fecha en la que se creo el mensaje. Campo requerido."
        },
        seen: {
          bsonType: "bool",
          description: "'seen' indica si el destinatario ya leyo el mensaje. Campo requerido."
        },
        friendship_id: {
          bsonType: ["int", "long"],
          description: "'friendship_id' es la id de la amistad. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// THREAD
// ==============================
db.createCollection("Thread", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "author_id", "title", "text", "likes_count", "created_at"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        author_id: {
          bsonType: ["int", "long"],
          description: "'author_id' es la id del autor del hilo. Campo requerido."
        },
        title: {
          bsonType: "string",
          description: "'title' es el titulo del hilo. Campo requerido."
        },
        text: {
          bsonType: "string",
          description: "'text' es el texto del hilo. Campo requerido."
        },
        likes_count: {
          bsonType: ["int", "long"],
          description: "'likes_count' es la cantidad de likes del hilo. Campo requerido."
        },
        created_at: {
          bsonType: "date",
          description: "'created_at' es la fecha en la que se creo el hilo. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// RESPONSE
// ==============================
db.createCollection("Response", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "thread_id", "author_id", "text", "likes_count", "created_at"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        thread_id: {
          bsonType: "objectId",
          description: "'thread_id' es la id del hilo al que se responde. Campo requerido."
        },
        author_id: {
          bsonType: ["int", "long"],
          description: "'author_id' es la id del autor de la respuesta. Campo requerido."
        },
        text: {
          bsonType: "string",
          description: "'text' es el texto de la respuesta. Campo requerido."
        },
        likes_count: {
          bsonType: ["int", "long"],
          description: "'likes_count' es la cantidad de likes de la respuesta. Campo requerido."
        },
        created_at: {
          bsonType: "date",
          description: "'created_at' es la fecha en la que se creo la respuesta. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// TAG
// ==============================
db.createCollection("Tag", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "name"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        name: {
          bsonType: "string",
          description: "'name' es el nombre de la tag. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// THREADTAGS
// ==============================
db.createCollection("ThreadTags", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "thread_id", "tag_id"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del archivo de la coleccion. Campo requerido."
        },
        thread_id: {
          bsonType: "objectId",
          description: "'thread_id' es la id del hilo al que se le asigna la tag. Campo requerido."
        },
        tag_id: {
          bsonType: "objectId",
          description: "'tag_id' es la id de la tag asignada al hilo. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// THREADLIKES
// ==============================
db.createCollection("ThreadLikes", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "thread_id", "author_id"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del like dado a un hilo. Campo requerido."
        },
        thread_id: {
          bsonType: "objectId",
          description: "'thread_id' es la id del hilo al que se le da el like. Campo requerido."
        },
        author_id: {
          bsonType: ["int", "long"],
          description: "'author_id' es la id del autor que da like. Campo requerido."
        }
      }
    }
  }
});


// ==============================
// RESPONSELIKES
// ==============================
db.createCollection("ResponseLikes", {
  validationLevel: "strict",
  validationAction: "error",
  validator: {
    "$jsonSchema": {
      bsonType: "object",
      required: ["_id", "response_id", "author_id"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "'_id' es la id del like dado a un hilo. Campo requerido."
        },
        response_id: {
          bsonType: "objectId",
          description: "'response_id' es la id de la respuesta a la que se le da el like. Campo requerido."
        },
        author_id: {
          bsonType: ["int", "long"],
          description: "'author_id' es la id del autor que da like. Campo requerido."
        }
      }
    }
  }
});


