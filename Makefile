NAME := mail-relay
DEST := /srv/services/$(NAME)
SERVICE := $(NAME).service

deploy:
	npm run build
	rsync -av --delete \
	  --exclude='src/' \
	  --exclude='node_modules/' \
	  --exclude='.env' \
	  --exclude='logs/' \
	  . $(DEST)/
	cp package.json pnpm-lock.yaml $(DEST)/
	cd $(DEST) && pnpm install --prod
	systemctl --user restart $(SERVICE)

restart:
	systemctl --user restart $(SERVICE)

status:
	systemctl --user status $(SERVICE)

logs:
	journalctl --user -u $(SERVICE) -n 50 -f
