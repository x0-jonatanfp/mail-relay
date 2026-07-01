NAME := mail-relay
DEST := /srv/services/$(NAME)
SERVICE := $(NAME).service

deploy:
	pnpm build && \
	  rsync -av --delete dist/ $(DEST)/dist/ && \
	  cp package.json pnpm-lock.yaml $(DEST)/
	rsync -av --delete templates/ $(DEST)/templates/
	cp clients.yaml $(DEST)/
	cd $(DEST) && rm -rf node_modules && CI=true pnpm install --prod --no-frozen-lockfile
	systemctl --user restart $(SERVICE)

restart:
	systemctl --user restart $(SERVICE)

status:
	systemctl --user status $(SERVICE)

logs:
	journalctl --user -u $(SERVICE) -n 50 -f
