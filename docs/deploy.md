# 部署说明

### HOST 配置
```host
127.0.0.1 www.a.com
127.0.0.1 www.b.com
127.0.0.1 www.c.com
```

### Nginx 配置
```conf
    # www.a.com
    server {
      listen 80;
      server_name www.a.com;

      location / {
        proxy_pass http://127.0.0.1:8080/;
      }
    }

    # www.b.com
    server {
      listen 80;
      server_name www.b.com;

      location / {
        proxy_pass http://127.0.0.1:8081/;
      }
    }

    # www.c.com
    server {
      listen 80;
      server_name www.c.com;

      location / {
        proxy_pass http://127.0.0.1:8082/;
      }
    }
```