NAME := mail-relay
DEST := /srv/services/$(NAME)
SERVICE := $(NAME)  # app PM2 (ver deploy/ecosystem.config.cjs de x0void)

deploy:
	pnpm build && \
	  rsync -av --delete dist/ $(DEST)/dist/ && \
	  cp package.json pnpm-lock.yaml $(DEST)/
	rsync -av --delete templates/ $(DEST)/templates/
	cp clients.yaml $(DEST)/
	cd $(DEST) && rm -rf node_modules && CI=true pnpm install --prod --no-frozen-lockfile
	pm2 restart $(SERVICE)
	pm2 save

restart:
	pm2 restart $(SERVICE)

status:
	pm2 status $(SERVICE)

logs:
	pm2 logs $(SERVICE) --lines 50
