# Country curriculum expansion

The Python files in this directory contain deliberately authored, jurisdiction-specific teaching notes. `apply.py` joins those notes to a common learning sequence and updates the existing resources and their interactive companions. It does not translate laws by substituting country names. England remains the reference curriculum.

The source register records the scope of each source check. An editorial check is not an independent professional review. Keep `practiceReviewedAt` unset until a named, qualified reviewer has actually reviewed the material. A publication date or Royal Assent does not establish commencement.

Run `python3 tools/curriculum/apply.py` after editing the source notes, then the normal build, content, monitoring and browser checks. Generated pages and downloadable tools must be rebuilt together.
