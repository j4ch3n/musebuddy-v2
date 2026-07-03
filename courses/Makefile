.PHONY: help chord-generate chord-upload pop909-process pop909-process-dry-run pop909-validate

UV_CACHE_DIR ?= /private/tmp/uv-cache
PYTHON := UV_CACHE_DIR=$(UV_CACHE_DIR) uv run python

SONG_ARGS := $(foreach song,$(SONG_IDS),--song-id $(song))
DATASET_ROOT_ARG := $(if $(DATASET_ROOT),--dataset-root "$(DATASET_ROOT)")
DATABASE_URL_ARG := $(if $(DATABASE_URL),--database-url "$(DATABASE_URL)")
SONG_LIMIT_ARG := $(if $(SONG_LIMIT),--song-limit $(SONG_LIMIT))
OUTPUT_DIR_ARG := $(if $(OUTPUT_DIR),--output-dir "$(OUTPUT_DIR)")
DRY_RUN_ARG := $(if $(DRY_RUN),--dry-run)

help:
	@printf '%s\n' 'Course script targets:'
	@printf '%s\n' '  make chord-generate'
	@printf '%s\n' '  make chord-upload DRY_RUN=1'
	@printf '%s\n' '  make pop909-process SONG_IDS="001 047 089 399"'
	@printf '%s\n' '  make pop909-process-dry-run SONG_IDS="001 047 089 399"'
	@printf '%s\n' '  make pop909-validate SONG_IDS="001 047 089 399"'
	@printf '%s\n' ''
	@printf '%s\n' 'Optional variables: ARGS, DATABASE_URL, DATASET_ROOT, OUTPUT_DIR, SONG_LIMIT, UV_CACHE_DIR'

chord-generate:
	$(PYTHON) chord_dictionary/generate.py $(if $(OUTPUT_DIR),--output "$(OUTPUT_DIR)") $(ARGS)

chord-upload:
	$(PYTHON) chord_dictionary/upload.py $(OUTPUT_DIR_ARG) $(DATABASE_URL_ARG) $(DRY_RUN_ARG) $(ARGS)

pop909-process:
	$(PYTHON) -m companion.process_pop909 $(DATASET_ROOT_ARG) $(DATABASE_URL_ARG) $(SONG_LIMIT_ARG) $(SONG_ARGS) $(ARGS)

pop909-validate:
	$(PYTHON) -m companion.validate_pop909 $(DATASET_ROOT_ARG) $(DATABASE_URL_ARG) $(SONG_LIMIT_ARG) $(SONG_ARGS) $(ARGS)
