# Project II. NGUYỄN THÀNH MINH 20200409

## Run server
```
    $ npm install express mysql12 body-parser bcrypt jsonwebtoken uuid getmac multer moment
    $ npm start
```

## Run server
đổi user password và database trong file connect.js

copy file database.sql chạy trên mysql workbench 



## API
<hr>

### 1. Signup
- **Link**: 
```
    http://localhost:3000/user/signup
```
- **Type**: POST
- **Request**:
  
    ```
        {   
            "username": "user3",
            "password": "3"
        }
    ```
- **Respone**:
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "null"
        }
    ```

### 2. Login
- **Link**:
```
    http://localhost:3000/user/login
```
- **Type**: POST
- **Request**:
  
    ```
        {   
            "username": "user3",
            "password": "3",
            "uuid": "50-81-40-85-D1-9C"
        }
    ```
- **Respone:**
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "{
                \"token\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIzIiwidXNlcklkIjo1LCJ1dWlkIjoiNTAtODEtNDAtODUtRDEtOUMiLCJpYXQiOjE2ODE2MzgzMDN9.PvhGn3LmxaAEaJ0MTq8xB-dgaZt7h1PuSlaWOQha79c\",
                \"id\":5,
                \"username\":\"user3\",
                \"avatar\":null,
                \"is_block\":0
            }"
        }
    ```

### 3. Logout
- **Link**:
```
    http://localhost:3000/user/logout
```
- **Type**: POST
- **Request**:
  
    ```
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIzIiwidXNlcklkIjo1LCJ1dWlkIjoiNTAtODEtNDAtODUtRDEtOUMiLCJpYXQiOjE2ODE2MzgzMDN9.PvhGn3LmxaAEaJ0MTq8xB-dgaZt7h1PuSlaWOQha79c"
        }
        // token lấy từ login
    ```
- **Respone:**
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "null"
        }
    ```
### 4. change_info_after_signup
- **Link**:
```
    http://localhost:3000/user/change_info_after_signup
```
- **Type**: PUT
- **Request**:
  
    ```
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIzIiwidXNlcklkIjo1LCJ1dWlkIjoiNTAtODEtNDAtODUtRDEtOUMiLCJpYXQiOjE2ODE2MzgzMDN9.PvhGn3LmxaAEaJ0MTq8xB-dgaZt7h1PuSlaWOQha79c" 
        }
        // token lấy từ login
    ```
- **Respone:**
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "{
                \"avatar\": \"avatar-98b47537-9735-431e-b89c-58d9aa5d6755.png\"
            }"
        }
    ```
### 5. get_list_rooms
- **Link**:
```
    http://localhost:3000/room/get_lists_rooms
```
- **Type**: GET
- **Request**:
  
    ```
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIzIiwidXNlcklkIjo1LCJ1dWlkIjoiNTAtODEtNDAtODUtRDEtOUMiLCJpYXQiOjE2ODE2MzgzMDN9.PvhGn3LmxaAEaJ0MTq8xB-dgaZt7h1PuSlaWOQha79c",
            "index": "0",
            "count": "20"
        }
        // token lấy từ login
    ```
- **Respone:**
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "{
                \"rooms\": [
                    {
                        \"room_id\": 1,
                        \"room_name\": \"room1\",
                        \"players\": 2
                    },
                    {
                        \"room_id\": 2,
                        \"room_name\": \"room2\",
                        \"players\": 0
                    },
                    {
                        \"room_id\": 3,
                        \"room_name\": \"room3\",
                        \"players\": 1
                    }
                ]
            }"
        }
    ```
### 6. get_rooom
- **Link**:
```
    http://localhost:3000/room/get_room
```
- **Type**: GET
- **Request**:
  
    ```
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIzIiwidXNlcklkIjo1LCJ1dWlkIjoiNTAtODEtNDAtODUtRDEtOUMiLCJpYXQiOjE2ODE2MzgzMDN9.PvhGn3LmxaAEaJ0MTq8xB-dgaZt7h1PuSlaWOQha79c",
            "room_id" : "3"
        }
        // token lấy từ login
    ```
- **Respone:**
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "{
                \"room_id\": 3,
                \"room_name\": \"room3\",
                \"current\": 1,
                \"max\": 25,
                \"speed\": 1,
                \"author\": {
                    \"username\": \"user3\",
                    \"id\": 5
                },
                \"created\":null,
                \"modified\":null
            }"
        }
    ```
### 7. add_room
- **Link**:
```
    http://localhost:3000/room/add_room
```
- **Type**: POST
- **Request**:
  
    ```
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluMyIsInVzZXJJZCI6NiwidXVpZCI6IjUwLTgxLTQwLTg1LUQxLTlDIiwiaWF0IjoxNjgxNjYwNzQ4fQ.AZAETxGk1rteXil0ujJJKmaIZ_CvMNjsu_ZpewwBIDE",
            "room_name": "room4",
            "max": "25"
        }
        // token lấy được sau khi login admin3
    ```
- **Respone:**
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "{
                \"room_id\": 4,
                \"room_name\": \"room4\",
                \"current\": 1,
                \"max\": 25,
                \"speed\": 1,
                \"author\": {
                    \"username\": \"admin3\",
                    \"id\": 6
                },
                \"created\": \"2023-04-16 22:53:34\",
                \"modified\": null
            }"
        }
    ```
### 8. edit_room
- **Link**:
```
    http://localhost:3000/room/edit_room
```
- **Type**: PUT
- **Request**:
  
    ```
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluMyIsInVzZXJJZCI6NiwidXVpZCI6IjUwLTgxLTQwLTg1LUQxLTlDIiwiaWF0IjoxNjgxNjYwNzQ4fQ.AZAETxGk1rteXil0ujJJKmaIZ_CvMNjsu_ZpewwBIDE",
            "room_id": "4",
            "room_name": "room4-update",
            "max": "26"
        }
        // token lấy được sau khi login admin3
    ```
- **Respone:**
  
    ```
        {
            "code": "1000",
            "message": "OK",
            "data": "{
                \"room_name\": \"room4-update\",
                \"max\": \"26\",
                \"room_id\": \"4\"
            }"
        }
    ```
