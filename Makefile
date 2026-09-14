NAME := mail-relay
DEST := /srv/services/$(NAME)
SERVICE := $(NAME)  # unidad de sistema (deploy/$(NAME).service)

deploy:
	pnpm build && \
	  rsync -av --delete dist/ $(DEST)/dist/ && \
	  cp package.json pnpm-lock.yaml $(DEST)/
	rsync -av --delete templates/ $(DEST)/templates/
	cp clients.yaml $(DEST)/
	cd $(DEST) && rm -rf node_modules && CI=true pnpm install --prod --no-frozen-lockfile
	sudo systemctl restart $(SERVICE).service

restart:
	sudo systemctl restart $(SERVICE).service

status:
	sudo systemctl status $(SERVICE).service --no-pager

logs:
	journalctl -u $(SERVICE).service -n 50 -f
