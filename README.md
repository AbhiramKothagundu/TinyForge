# TinyForge

## Overview

TinyForge is a high-performance URL shortener built with Node.js, Express, PostgreSQL, Redis, and Nginx, designed for scalability and efficiency. It converts long URLs into short, shareable links while tracking analytics such as the number of visits.

✅ Built for Speed – Uses Redis caching to serve frequent requests quickly.
✅ Scalable – Shards the database across multiple PostgreSQL instances.
✅ Resilient – Nginx load balances traffic across backend instances.
✅ Simple API – No frontend, just cURL-based interaction for now.

Here's an improved explanation of **TinyForge**, including details about **count cache, recently used cache, sharding, hashing, load balancing, retrieval**, and a **step-by-step guide to using it via cURL**.

---

## **⚡ System Design & Architecture**

### **1️⃣ Core Components**

-   **Backend**: Node.js + Express for API handling.
-   **Database**: PostgreSQL (Sharded for scalability).
-   **Cache**: Redis for frequently accessed links (Recently Used Cache).
-   **Reverse Proxy**: Nginx for load balancing and request routing.
-   **Docker**: Used for containerized deployment.

---

### **2️⃣ How Caching Works**

TinyForge uses **two types of caching strategies** to enhance performance:

#### **🔴 Count Cache (Redis) – Tracks Clicks on URLs**

Every time a short URL is accessed, we increment the **click counter** in Redis. Instead of hitting the database for each request, we store **click counts in Redis** and periodically sync them to PostgreSQL.

✅ **Fast retrieval** – Avoids database hits for frequently accessed URLs.  
✅ **Efficient tracking** – Keeps an up-to-date count of visits in memory.

```js
// Increment click count in Redis
async function incrementClickCount(shortUrl) {
    await redisClient.incr(`count:${shortUrl}`);
}
```

#### **🟢 Recently Used Cache (Redis) – Stores Popular URLs**

TinyForge keeps a **hot cache** of frequently accessed URLs in Redis, reducing database lookups.

✅ **Faster URL resolution** – Redirects without querying PostgreSQL.  
✅ **LRU Eviction** – If Redis is full, least-used URLs get removed first.

```js
// Store shortened URL in Redis cache
async function cacheShortUrl(shortUrl, longUrl) {
    await redisClient.setex(`url:${shortUrl}`, 3600, longUrl); // Expires in 1 hour
}
```

---

### **3️⃣ Sharding in PostgreSQL**

Instead of a single database, **TinyForge uses multiple database shards** to distribute the load.

#### **🟡 How Sharding Works**

1️⃣ **Each short URL is hashed** using a consistent hashing algorithm.  
2️⃣ The hash determines which PostgreSQL instance (shard) will store it.  
3️⃣ Requests query the **correct shard** based on the hashed value.

**Example Hashing Logic** (Modulo-based sharding):

```js
const shards = [
    "postgres://user:pass@shard1/db",
    "postgres://user:pass@shard2/db",
    "postgres://user:pass@shard3/db",
];

// Hash-based sharding
function getShard(shortUrl) {
    const hash = shortUrl
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return shards[hash % shards.length];
}
```

✅ **Even Distribution** – URLs are evenly spread across shards.  
✅ **Parallel Queries** – Multiple shards handle requests simultaneously.

---

### **4️⃣ Load Balancing with Nginx**

TinyForge uses **NGINX** to distribute traffic across multiple backend instances.

#### **🔵 How Load Balancer Works**

1️⃣ Nginx sits in front of multiple Node.js instances.  
2️⃣ It **distributes requests** to different instances based on **Round Robin** or **Least Connections** strategy.

✅ **Prevents overload** on a single server.  
✅ **Handles high traffic efficiently**.

```nginx
# Nginx load balancing config
upstream backend_servers {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend_servers;
    }
}
```

---

## **🛠 Deployment with Docker Compose**

### **Dockerized Components**

TinyForge runs in **multiple containers** managed by Docker Compose:

1. **Backend (Node.js + Express)**
2. **PostgreSQL Shards (3 instances)**
3. **Redis Cache**
4. **Nginx Load Balancer**

### **📌 docker-compose.yml**

```yaml
version: "3.8"

services:
    redis:
        image: redis:latest
        container_name: redis
        ports:
            - "6379:6379"

    postgres1:
        image: postgres:latest
        environment:
            POSTGRES_DB: shard_1
            POSTGRES_USER: user
            POSTGRES_PASSWORD: password

    postgres2:
        image: postgres:latest
        environment:
            POSTGRES_DB: shard_2
            POSTGRES_USER: user
            POSTGRES_PASSWORD: password

    postgres3:
        image: postgres:latest
        environment:
            POSTGRES_DB: shard_3
            POSTGRES_USER: user
            POSTGRES_PASSWORD: password

    backend:
        build: .
        depends_on:
            - redis
            - postgres1
            - postgres2
            - postgres3
        ports:
            - "5000:5000"

    nginx:
        image: nginx:latest
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf
        depends_on:
            - backend
        ports:
            - "80:80"
```

✅ **Easily scalable** – Add more instances if traffic increases.  
✅ **Microservices-friendly** – Each service is independently managed.

---

## **📌 Setting Up Environment Variables**

To configure the application, create a `.env` file in the root directory of the project with the following content:

```plaintext
PORT=5000
DATABASE_URL_1=postgres://url_shortener:5002@host.docker.internal:5432/shard_1
DATABASE_URL_2=postgres://url_shortener:5002@host.docker.internal:5432/shard_2
DATABASE_URL_3=postgres://url_shortener:5002@host.docker.internal:5432/shard_3
REDIS_URL=redis://localhost:6379
```

This file is ignored by Git (as specified in `.gitignore`) to keep sensitive information secure.

---

## **📌 Guide to Using TinyForge (cURL API Requests)**

Since there's no frontend yet, use **cURL** to interact with the API.

### **1️⃣ Shorten a URL**

```sh
curl -X POST http://localhost:5000/shorten -H "Content-Type: application/json" -d '{"longUrl": "https://example.com"}'
```

✅ **Response:** `{ "shortUrl": "http://localhost:5000/abc123" }`

---

### **2️⃣ Redirect to Original URL**

```sh
curl -X GET http://localhost:5000/abc123
```

✅ **Response:** `302 Redirect to https://example.com`

---

### **3️⃣ Get Analytics (Click Count)**

```sh
curl -X GET http://localhost:5000/stats/abc123
```

✅ **Response:** `{ "clicks": 25, "originalUrl": "https://example.com" }`

---

-   **Backend (Node.js & Express)**: Handles URL shortening, redirection, and analytics.
-   **Database (PostgreSQL)**: Stores original URLs, short codes, and request metadata.
-   **Count Cache (Redis)**: Used for fast lookups and storing frequently accessed URLs.
-   **Reverse Proxy (NGINX)**: Load balances traffic across multiple backend instances.

### **2. Project Structure**

```
backend/
├── docker-compose.yml   # Defines multi-container setup
├── Dockerfile           # Docker image for backend
├── init.sql             # Database initialization script
├── nginx.conf           # NGINX reverse proxy configuration
├── package.json         # Node.js dependencies
├── package-lock.json    # Dependency lock file
├── README.md            # Project documentation
└── src/
    ├── config/
    │   └── redis.js      # Redis client configuration
    ├── controllers/
    │   └── urlController.js # Handles API logic
    ├── index.js          # Entry point for the backend
    ├── models/
    │   ├── db.js         # PostgreSQL connection
    │   └── urlModel.js   # URL schema/model
    ├── routes/
    │   └── urlRoutes.js  # API routes
    ├── services/
    │   └── countService.js  # Click analytics service
```

### **3. Key Features**

✅ **URL Shortening** – Convert long URLs into short, unique slugs.  
✅ **Redirection** – Automatically redirect users to the original URL.  
✅ **Database Storage** – Persist URLs in PostgreSQL with metadata.  
✅ **Caching with Redis** – Improve performance by storing frequently accessed URLs.  
✅ **Rate Limiting** – Prevent abuse by limiting requests per user.  
✅ **Analytics** – Track number of visits per shortened URL.  
✅ **Dockerized Deployment** – Run services using Docker & Docker Compose.  
✅ **NGINX Load Balancing** – Distribute traffic across backend instances.

---

## **Skills & Concepts Learned**

This project helped me build expertise in:

### **Backend Development:**

-   RESTful API development with **Node.js & Express**.
-   PostgreSQL for **persistent data storage**.
-   Redis for **caching and performance optimization**.
-   Middleware handling for **security and request logging**.

### **DevOps & Deployment:**

-   **Docker & Docker Compose** for containerized development.
-   **NGINX** as a reverse proxy & load balancer.
-   Using **environment variables** for configuration management.

### **System Design & Optimization:**

-   Database indexing and query optimization.
-   **Horizontal scaling** using NGINX and multiple backend instances.
-   Rate limiting & caching to improve **efficiency and security**.

---

## **Setup & Running the Project**

### **1. Clone the Repository**

```sh
git clone https://github.com/yourusername/url_shortener.git
cd url_shortener/backend
```

### **2. Set Up Environment Variables**

Create a `.env` file in the root directory with the following content:

```plaintext
PORT=5000
DATABASE_URL_1=postgres://url_shortener:5002@host.docker.internal:5432/shard_1
DATABASE_URL_2=postgres://url_shortener:5002@host.docker.internal:5432/shard_2
DATABASE_URL_3=postgres://url_shortener:5002@host.docker.internal:5432/shard_3
REDIS_URL=redis://localhost:6379
```

### **3. Start the Containers**

```sh
docker-compose up --build
```

### **4. Access the API**

-   Base URL: `http://localhost:5000/`
-   API Endpoints:
    -   `POST /shorten` – Shorten a URL
    -   `GET /:shortUrl` – Redirect to the original URL

---

## **Future Improvements**

🔹 **Custom Short Links** – Allow users to choose custom slugs.  
🔹 **User Authentication** – Add authentication for tracking personal links.  
🔹 **Expiration Mechanism** – Auto-delete old links after a period.  
🔹 **UI Dashboard** – Web-based interface to manage and analyze shortened links.

---

## **Conclusion**

This project was a **deep dive into full-stack backend development**, with a focus on **scalability, caching, and system design**. It strengthened my skills in **Node.js, PostgreSQL, Redis, and Docker**, preparing me for **real-world system design interviews**. 🚀

---

### **📌 Connect with Me**

If you have feedback, questions, or ideas for collaboration, feel free to reach out!

📧 Email: abhikothagundu@gmail.com  
💻 GitHub: [github.com/AbhiramKothagundu](https://github.com/AbhiramKothagundu)
