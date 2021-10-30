# A China Holiday checker

A simple service to check that the date is holiday or not.

I just use it for my Nodered service to check the date is a work day.

## How to use it

```
docker build -t=ten/ch_holiday_checker .
docker run --restart=always --name holiday_checker -d -p 8081:8080 ten/ch_holiday_checker
```

## Notice

This `Dockerfile` just for Ubuntu. If you are running on other docker host, please change the timezone for your host environment.