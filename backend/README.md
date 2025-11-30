cd backend
python -m venv venv
venv\Scripts\activate

<!-- refis docker command -->
docker run -d --name redis-local -p 6379:6379 redis:7-alpine

<!-- test redis -->
docker exec -it redis-local redis-cli ping