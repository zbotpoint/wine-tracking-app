-- Palestine (Cremisan, Taybeh, and other West Bank producers).
insert into countries (code, name) values ('PS', 'Palestine')
on conflict (code) do nothing;
