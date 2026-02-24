
# Feature roadmap for Docky

### Done:
- [x] Simple auth with OAuth2 and JWT
- [x] Simple data models for basic classes
- [x] Get and Post methods for Users, Chats and Messages entities
- [x] Delete method for each entity 
- [x] Document upload
- [x] Simple task system with celery
- [x] Add simple RAG functionality
- [x] Add RAG-Chat functionality
- [x] Chat history during inference

### Current tasks:
- [ ] Add summarization for documents
- [ ] Showing best chunks from text


### For later:
- [ ] Fix chat deletion when one of the users gets deleted
- [ ] Migration from SQLModel to SQLAlchemy + Pydantic
- [ ] Adding Alembic for DB migrations
- [ ] Adding Put methods to each entity