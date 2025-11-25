-- Create decks table
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quiz_history JSONB DEFAULT '[]'::jsonb
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    srs_level INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create media_assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON public.media_assets(user_id);

-- Enable Row Level Security
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for decks
CREATE POLICY "Users can view their own decks"
    ON public.decks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
    ON public.decks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
    ON public.decks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
    ON public.decks FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for flashcards
CREATE POLICY "Users can view flashcards in their decks"
    ON public.flashcards FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.decks
        WHERE decks.id = flashcards.deck_id
        AND decks.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert flashcards in their decks"
    ON public.flashcards FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.decks
        WHERE decks.id = flashcards.deck_id
        AND decks.user_id = auth.uid()
    ));

CREATE POLICY "Users can update flashcards in their decks"
    ON public.flashcards FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.decks
        WHERE decks.id = flashcards.deck_id
        AND decks.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete flashcards in their decks"
    ON public.flashcards FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.decks
        WHERE decks.id = flashcards.deck_id
        AND decks.user_id = auth.uid()
    ));

-- Create RLS policies for media_assets
CREATE POLICY "Users can view their own media assets"
    ON public.media_assets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media assets"
    ON public.media_assets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media assets"
    ON public.media_assets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media assets"
    ON public.media_assets FOR DELETE
    USING (auth.uid() = user_id);
