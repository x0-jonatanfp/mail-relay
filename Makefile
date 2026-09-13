NAME := mail-relay
DEST := /srv/services/$(NAME)
SERVICE := $(NAME)  # unidad systemd --user (deploy/$(NAME).service)

deploy:
	pnpm build && \
	  rsync -av --delete dist/ $(DEST)/dist/ && \
	  cp package.json pnpm-lock.yaml $(DEST)/
	rsync -av --delete templates/ $(DEST)/templates/
	cp clients.yaml $(DEST)/
	cd $(DEST) && rm -rf node_modules && CI=true pnpm install --prod --no-frozen-lockfile
	systemctl --user restart $(SERVICE).service

restart:
	systemctl --user restart $(SERVICE).service

status:
	systemctl --user status $(SERVICE).service --no-pager

logs:
	journalctl --user -u $(SERVICE).service -n 50 -f
