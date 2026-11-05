// ==============================
// INDEXES
// ==============================
db.Folder.createIndex({ author_id: 1 });


db.FolderPermission.createIndex({ folder_id: 1 });
db.FolderPermission.createIndex({ user_id: 1 });


db.FileRelation.createIndex({ file_id: 1 });
db.FileRelation.createIndex({ collection_id: 1 });


db.Message.createIndex({ friendship_id: 1 });
db.Message.createIndex({ author_id: 1 });
db.Message.createIndex({ created_at: -1 });
db.Message.createIndex({ friendship_id: 1, created_at: -1, _id: -1 });


db.Thread.createIndex({ author_id: 1 });


db.Response.createIndex({ thread_id: 1 });
db.Response.createIndex({ author_id: 1 });


db.ThreadTags.createIndex({ thread_id: 1 });
db.ThreadTags.createIndex({ tag_id: 1 });


db.ThreadLikes.createIndex({ thread_id: 1 });
db.ThreadLikes.createIndex({ user_id: 1 });


db.ResponseLikes.createIndex({ response_id: 1 });
db.ResponseLikes.createIndex({ user_id: 1 });
