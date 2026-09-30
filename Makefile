.PHONY: check test

PY  := $(shell [ -x .venv/bin/python ] && echo .venv/bin/python || echo python3)
PIP := $(shell [ -x .venv/bin/pip ] && echo .venv/bin/pip || echo pip3)

test:
	$(PY) -m pytest

check:
	$(PIP) install -e ".[dev]" -q
	$(PY) -m ruff check src
	$(PY) -m ruff format --check src
	$(PY) -m mypy src
	$(MAKE) test
