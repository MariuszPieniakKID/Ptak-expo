--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: communications; Type: TABLE; Schema: public; Owner: kid
--

CREATE TABLE public.communications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    type character varying(20) DEFAULT 'announcement'::character varying,
    is_read boolean DEFAULT false,
    exhibition_id integer,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT communications_type_check CHECK (((type)::text = ANY ((ARRAY['announcement'::character varying, 'notification'::character varying, 'reminder'::character varying])::text[])))
);


ALTER TABLE public.communications OWNER TO kid;

--
-- Name: communications_id_seq; Type: SEQUENCE; Schema: public; Owner: kid
--

CREATE SEQUENCE public.communications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.communications_id_seq OWNER TO kid;

--
-- Name: communications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kid
--

ALTER SEQUENCE public.communications_id_seq OWNED BY public.communications.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: kid
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_url character varying(500),
    file_type character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    exhibition_id integer,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.documents OWNER TO kid;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: kid
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.documents_id_seq OWNER TO kid;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kid
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: exhibitions; Type: TABLE; Schema: public; Owner: kid
--

CREATE TABLE public.exhibitions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_date date,
    end_date date,
    location character varying(255),
    status character varying(20) DEFAULT 'planned'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exhibitions_status_check CHECK (((status)::text = ANY ((ARRAY['planned'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.exhibitions OWNER TO kid;

--
-- Name: exhibitions_id_seq; Type: SEQUENCE; Schema: public; Owner: kid
--

CREATE SEQUENCE public.exhibitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exhibitions_id_seq OWNER TO kid;

--
-- Name: exhibitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kid
--

ALTER SEQUENCE public.exhibitions_id_seq OWNED BY public.exhibitions.id;


--
-- Name: exhibitor_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exhibitor_events (
    id integer NOT NULL,
    exhibitor_id integer,
    exhibition_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.exhibitor_events OWNER TO postgres;

--
-- Name: exhibitor_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exhibitor_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exhibitor_events_id_seq OWNER TO postgres;

--
-- Name: exhibitor_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exhibitor_events_id_seq OWNED BY public.exhibitor_events.id;


--
-- Name: exhibitors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exhibitors (
    id integer NOT NULL,
    nip character varying(20) NOT NULL,
    company_name character varying(255) NOT NULL,
    address character varying(255) NOT NULL,
    postal_code character varying(10) NOT NULL,
    city character varying(100) NOT NULL,
    contact_person character varying(255) NOT NULL,
    contact_role character varying(100) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exhibitors_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.exhibitors OWNER TO postgres;

--
-- Name: exhibitors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exhibitors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.exhibitors_id_seq OWNER TO postgres;

--
-- Name: exhibitors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exhibitors_id_seq OWNED BY public.exhibitors.id;


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: kid
--

CREATE TABLE public.invitations (
    id integer NOT NULL,
    guest_email character varying(255) NOT NULL,
    guest_name character varying(255),
    guest_company character varying(255),
    status character varying(20) DEFAULT 'sent'::character varying,
    invitation_code character varying(100),
    exhibition_id integer,
    exhibitor_id integer,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activated_at timestamp without time zone,
    confirmed_at timestamp without time zone,
    CONSTRAINT invitations_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'activated'::character varying, 'confirmed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.invitations OWNER TO kid;

--
-- Name: invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: kid
--

CREATE SEQUENCE public.invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invitations_id_seq OWNER TO kid;

--
-- Name: invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kid
--

ALTER SEQUENCE public.invitations_id_seq OWNED BY public.invitations.id;


--
-- Name: marketing_materials; Type: TABLE; Schema: public; Owner: kid
--

CREATE TABLE public.marketing_materials (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_url character varying(500),
    file_type character varying(50),
    tags text[],
    exhibition_id integer,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.marketing_materials OWNER TO kid;

--
-- Name: marketing_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: kid
--

CREATE SEQUENCE public.marketing_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.marketing_materials_id_seq OWNER TO kid;

--
-- Name: marketing_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kid
--

ALTER SEQUENCE public.marketing_materials_id_seq OWNED BY public.marketing_materials.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: kid
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'guest'::character varying NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    company_name character varying(255),
    phone character varying(50),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO kid;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: kid
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO kid;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kid
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: communications id; Type: DEFAULT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.communications ALTER COLUMN id SET DEFAULT nextval('public.communications_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: exhibitions id; Type: DEFAULT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.exhibitions ALTER COLUMN id SET DEFAULT nextval('public.exhibitions_id_seq'::regclass);


--
-- Name: exhibitor_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitor_events ALTER COLUMN id SET DEFAULT nextval('public.exhibitor_events_id_seq'::regclass);


--
-- Name: exhibitors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitors ALTER COLUMN id SET DEFAULT nextval('public.exhibitors_id_seq'::regclass);


--
-- Name: invitations id; Type: DEFAULT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.invitations ALTER COLUMN id SET DEFAULT nextval('public.invitations_id_seq'::regclass);


--
-- Name: marketing_materials id; Type: DEFAULT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.marketing_materials ALTER COLUMN id SET DEFAULT nextval('public.marketing_materials_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: communications; Type: TABLE DATA; Schema: public; Owner: kid
--

COPY public.communications (id, title, content, type, is_read, exhibition_id, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: kid
--

COPY public.documents (id, title, description, file_url, file_type, status, exhibition_id, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: exhibitions; Type: TABLE DATA; Schema: public; Owner: kid
--

COPY public.exhibitions (id, name, description, start_date, end_date, location, status, created_at, updated_at) FROM stdin;
1	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
2	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
3	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
4	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
5	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
6	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
7	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
8	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
9	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-17 20:52:08.444975	2025-07-17 20:52:08.444975
10	Moje pierwsze wydrążenie	Moj opis	2025-07-17	2025-07-18	warszawa	planned	2025-07-17 21:18:32.81565	2025-07-17 21:18:32.81565
11	SUPER extra Targi	Super targi	2025-08-11	2025-09-29	Warszawa	planned	2025-07-17 21:36:22.983652	2025-07-17 21:36:22.983652
12	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
13	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
14	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
15	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
16	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
17	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
18	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
19	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
20	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-17 21:37:32.16633	2025-07-17 21:37:32.16633
21	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
22	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
23	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
24	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
25	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
26	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
27	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
28	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
29	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-17 22:18:25.801904	2025-07-17 22:18:25.801904
30	Targi nr 2	asas	2025-07-28	2025-07-31	Wawa	planned	2025-07-17 22:52:19.225342	2025-07-17 22:52:19.225342
31	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
32	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
33	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
34	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
35	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
36	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
37	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
38	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
39	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-17 23:02:03.792459	2025-07-17 23:02:03.792459
40	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
41	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
42	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
43	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
44	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
45	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
46	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
47	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
48	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-18 09:19:03.485598	2025-07-18 09:19:03.485598
49	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
50	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
51	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
52	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
53	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
54	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
55	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
56	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
57	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-18 09:23:23.648521	2025-07-18 09:23:23.648521
58	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
59	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
60	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
61	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
62	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
63	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
64	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
65	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
66	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-18 09:49:55.861459	2025-07-18 09:49:55.861459
67	Branżowe Targi Technologii Filtracji i Zastosowania Filtrów	Największe targi technologii filtracji w Polsce	2026-03-11	2026-03-15	Warszawa	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
68	International Trade Fair for Building Technologies and Materials	Międzynarodowe targi technologii budowlanych	2026-03-11	2026-03-15	Kraków	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
69	Targi Technologii Medycznych i Farmaceutycznych	Specjalistyczne targi branży medycznej	2026-04-20	2026-04-23	Gdańsk	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
70	Międzynarodowe Targi Energii Odnawialnej	Targi poświęcone zielonej energii	2026-05-15	2026-05-18	Wrocław	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
71	Targi Automatyki Przemysłowej	Nowoczesne rozwiązania automatyki	2026-06-10	2026-06-13	Katowice	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
72	Targi Technologii Informatycznych	Najnowsze trendy w IT	2026-07-08	2026-07-11	Poznań	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
73	Międzynarodowe Targi Materiałów Podłogowych i Powierzchniowych	Targi materiałów wykończeniowych	2025-06-03	2025-06-05	Warszawa	active	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
74	Targi Bezpieczeństwa i Ochrony	Systemy bezpieczeństwa i ochrony	2026-08-12	2026-08-15	Łódź	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
75	Targi Transportu i Logistyki	Nowoczesne rozwiązania transportowe	2026-09-05	2026-09-08	Szczecin	planned	2025-07-18 09:54:57.732856	2025-07-18 09:54:57.732856
\.


--
-- Data for Name: exhibitor_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exhibitor_events (id, exhibitor_id, exhibition_id, created_at) FROM stdin;
1	19	1	2025-07-17 21:38:13.004175
2	20	7	2025-07-17 21:40:29.434682
4	21	11	2025-07-17 21:48:01.459137
5	22	11	2025-07-17 22:15:21.111272
6	19	2	2025-07-18 09:42:07.547039
7	19	3	2025-07-18 09:42:07.547039
8	21	1	2025-07-18 09:42:07.547039
9	21	2	2025-07-18 09:42:07.547039
10	22	4	2025-07-18 09:42:07.547039
11	22	5	2025-07-18 09:42:07.547039
\.


--
-- Data for Name: exhibitors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exhibitors (id, nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, status, created_at, updated_at) FROM stdin;
2	9876543210	TechnoMed Solutions	Al. Medyczna 8	31-000	Kraków	Anna Nowak	Dyrektor Handlowy	+48 12 987 65 43	a.nowak@technomed.pl	active	2025-07-17 18:57:04.268674	2025-07-17 18:57:04.268674
5	4444555666	Industrial Automation Ltd	ul. Przemysłowa 44	40-001	Katowice	Tomasz Zieliński	Inżynier Sprzedaży	+48 32 444 55 66	t.zielinski@automation.pl	active	2025-07-17 18:57:04.268674	2025-07-17 18:57:04.268674
6	1234567890	Moja Pierwsza	ul. WWW 23	00-001	Warszawa	Janek	Kirownik	123123123	dsdsd@dsdsd.com	active	2025-07-17 19:31:43.856561	2025-07-17 19:31:43.856561
13	1234567892	Test Exhibitor	Test Address	00-001	Warszawa	Test Person	Manager	123456789	test@test.com	active	2025-07-17 21:36:36.22583	2025-07-17 21:36:36.22583
16	5555666777	Green Energy Systems	ul. Zielona 22	50-001	Wrocław	Piotr Wiśniewski	Specjalista ds. Sprzedaży	+48 71 555 66 77	p.wisniewski@green-energy.pl	active	2025-07-17 21:37:32.165544	2025-07-17 21:37:32.165544
19	1234567894	Test Exhibitor 3	Test Address	00-001	Warszawa	Test Person	Manager	123456789	test3@test.com	active	2025-07-17 21:38:13.002701	2025-07-17 21:38:13.002701
20	1234567895	OJOJ2	Moja ulica	00-001	Wawa	Janek	CO	123123123	jan2@jan.com	active	2025-07-17 21:40:29.431843	2025-07-17 21:40:29.431843
21	1234567893	Firemka 2	Superowa	00-001	Warszawa	Janek	KO	123123123	sdasd@asas.com	active	2025-07-17 21:48:01.456161	2025-07-17 21:48:01.456161
22	1234567850	Jachty SA	Waaas	00-001	Warszawa	Jan	kkk	123123123	sada@sdas.com	active	2025-07-17 22:15:21.105744	2025-07-17 22:15:21.105744
51	1111222333	Digital Marketing Pro	ul. Cyfrowa 5	80-001	Gdańsk	Maria Kowalczyk	Account Manager	+48 58 111 22 33	m.kowalczyk@digitalmarketing.pl	active	2025-07-18 09:54:57.73107	2025-07-18 09:54:57.73107
\.


--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: kid
--

COPY public.invitations (id, guest_email, guest_name, guest_company, status, invitation_code, exhibition_id, exhibitor_id, sent_at, activated_at, confirmed_at) FROM stdin;
\.


--
-- Data for Name: marketing_materials; Type: TABLE DATA; Schema: public; Owner: kid
--

COPY public.marketing_materials (id, title, description, file_url, file_type, tags, exhibition_id, is_public, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: kid
--

COPY public.users (id, email, password_hash, role, first_name, last_name, company_name, phone, status, created_at, updated_at) FROM stdin;
1	admin@ptak-expo.com	$2a$10$hX.pUgc6uWoiNIpwY3pKi.sfuYiYsVuu5LSkqDElNNHUPDIbCT6Tu	admin	Admin	PTAK EXPO	\N	\N	active	2025-07-10 23:58:29.206711+02	2025-07-10 23:58:29.206711+02
2	test@test.com	$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G	exhibitor	Test	User	\N	+48 123 456 789	active	2025-07-10 23:58:29.207859+02	2025-07-10 23:58:29.207859+02
3	magda.masny@warsawexpo.eu	$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G	exhibitor	Magda	Masny	\N	+48 518 739 122	active	2025-07-10 23:58:29.207859+02	2025-07-10 23:58:29.207859+02
4	quang.thuy@warsawexpo.eu	$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G	exhibitor	Quang	Thuy	\N	+48 518 739 123	active	2025-07-10 23:58:29.207859+02	2025-07-10 23:58:29.207859+02
5	anna.dereszowska@warsawexpo.eu	$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G	exhibitor	Anna	Dereszowska	\N	+48 518 739 124	active	2025-07-10 23:58:29.207859+02	2025-07-10 23:58:29.207859+02
6	marian.pienkowski@warsawexpo.eu	$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G	exhibitor	Marian	Pienkowski	\N	+48 518 739 125	active	2025-07-10 23:58:29.207859+02	2025-07-10 23:58:29.207859+02
7	test.admin@ptak-expo.com	$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G	admin	Test	Admin	\N	\N	active	2025-07-10 23:59:19.910896+02	2025-07-10 23:59:19.910896+02
\.


--
-- Name: communications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kid
--

SELECT pg_catalog.setval('public.communications_id_seq', 1, false);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kid
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- Name: exhibitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kid
--

SELECT pg_catalog.setval('public.exhibitions_id_seq', 75, true);


--
-- Name: exhibitor_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exhibitor_events_id_seq', 11, true);


--
-- Name: exhibitors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exhibitors_id_seq', 52, true);


--
-- Name: invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kid
--

SELECT pg_catalog.setval('public.invitations_id_seq', 1, false);


--
-- Name: marketing_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kid
--

SELECT pg_catalog.setval('public.marketing_materials_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kid
--

SELECT pg_catalog.setval('public.users_id_seq', 127, true);


--
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: exhibitions exhibitions_pkey; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.exhibitions
    ADD CONSTRAINT exhibitions_pkey PRIMARY KEY (id);


--
-- Name: exhibitor_events exhibitor_events_exhibitor_id_exhibition_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitor_events
    ADD CONSTRAINT exhibitor_events_exhibitor_id_exhibition_id_key UNIQUE (exhibitor_id, exhibition_id);


--
-- Name: exhibitor_events exhibitor_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitor_events
    ADD CONSTRAINT exhibitor_events_pkey PRIMARY KEY (id);


--
-- Name: exhibitors exhibitors_nip_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitors
    ADD CONSTRAINT exhibitors_nip_key UNIQUE (nip);


--
-- Name: exhibitors exhibitors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitors
    ADD CONSTRAINT exhibitors_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_invitation_code_key; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invitation_code_key UNIQUE (invitation_code);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: marketing_materials marketing_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.marketing_materials
    ADD CONSTRAINT marketing_materials_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: communications communications_exhibition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_exhibition_id_fkey FOREIGN KEY (exhibition_id) REFERENCES public.exhibitions(id);


--
-- Name: communications communications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: documents documents_exhibition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_exhibition_id_fkey FOREIGN KEY (exhibition_id) REFERENCES public.exhibitions(id);


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: exhibitor_events exhibitor_events_exhibition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitor_events
    ADD CONSTRAINT exhibitor_events_exhibition_id_fkey FOREIGN KEY (exhibition_id) REFERENCES public.exhibitions(id) ON DELETE CASCADE;


--
-- Name: exhibitor_events exhibitor_events_exhibitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exhibitor_events
    ADD CONSTRAINT exhibitor_events_exhibitor_id_fkey FOREIGN KEY (exhibitor_id) REFERENCES public.exhibitors(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_exhibition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_exhibition_id_fkey FOREIGN KEY (exhibition_id) REFERENCES public.exhibitions(id);


--
-- Name: invitations invitations_exhibitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_exhibitor_id_fkey FOREIGN KEY (exhibitor_id) REFERENCES public.users(id);


--
-- Name: marketing_materials marketing_materials_exhibition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kid
--

ALTER TABLE ONLY public.marketing_materials
    ADD CONSTRAINT marketing_materials_exhibition_id_fkey FOREIGN KEY (exhibition_id) REFERENCES public.exhibitions(id);


--
-- PostgreSQL database dump complete
--

