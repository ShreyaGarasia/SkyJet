"""SkyJet domain data: cities, routes, flight-type helpers."""

DOMESTIC_CITIES = [
    "Ahmedabad", "Delhi", "Mumbai", "Goa", "Jaipur", "Pune",
    "Hyderabad", "Chennai", "Bangalore", "Kolkata",
]

INTERNATIONAL_CITIES = [
    "Singapore", "Tokyo", "Dubai", "Bangkok", "Kuala Lumpur", "Seoul",
    "Hong Kong", "Jakarta", "Bali", "Manila", "Doha", "Abu Dhabi",
    "Taipei", "Hanoi", "Osaka",
]

CITY_CODES = {
    "Ahmedabad": "AMD", "Delhi": "DEL", "Mumbai": "BOM", "Goa": "GOI",
    "Jaipur": "JAI", "Pune": "PNQ", "Hyderabad": "HYD", "Chennai": "MAA",
    "Bangalore": "BLR", "Kolkata": "CCU",
    "Singapore": "SIN", "Tokyo": "HND", "Dubai": "DXB", "Bangkok": "BKK",
    "Kuala Lumpur": "KUL", "Seoul": "ICN", "Hong Kong": "HKG",
    "Jakarta": "CGK", "Bali": "DPS", "Manila": "MNL", "Doha": "DOH",
    "Abu Dhabi": "AUH", "Taipei": "TPE", "Hanoi": "HAN", "Osaka": "KIX",
    # Legacy airport names used in existing seed data
    "Singapore (SIN)": "SIN", "Delhi (DEL)": "DEL", "Mumbai (BOM)": "BOM",
    "Bangalore (BLR)": "BLR", "Chennai (MAA)": "MAA", "Hyderabad (HYD)": "HYD",
    "Kolkata (CCU)": "CCU", "Tokyo (HND)": "HND", "Hong Kong (HKG)": "HKG",
    "Bangkok (BKK)": "BKK", "Kuala Lumpur (KUL)": "KUL", "Dubai (DXB)": "DXB",
    "Abu Dhabi (AUH)": "AUH", "Doha (DOH)": "DOH", "Seoul (ICN)": "ICN",
    "Taipei (TPE)": "TPE", "Jakarta (CGK)": "CGK", "Bali (DPS)": "DPS",
    "Manila (MNL)": "MNL", "Hanoi (HAN)": "HAN", "Osaka (KIX)": "KIX",
}

DOMESTIC_SET = set(DOMESTIC_CITIES)
INTERNATIONAL_SET = set(INTERNATIONAL_CITIES)


def city_label(city: str) -> str:
    code = CITY_CODES.get(city) or CITY_CODES.get(city.split("(")[0].strip())
    if not code and "(" in city:
        import re
        m = re.search(r"\(([A-Z]{3})\)", city)
        code = m.group(1) if m else None
    if code and "(" not in city:
        return f"{city} ({code})"
    return city


def parse_city_name(location: str) -> str:
    if not location:
        return ""
    return location.split("(")[0].strip()


def flight_type_for_route(origin: str, destination: str) -> str:
    o = parse_city_name(origin)
    d = parse_city_name(destination)
    if o in DOMESTIC_SET and d in DOMESTIC_SET:
        return "Domestic"
    return "International"


def flight_type_for_location(location: str) -> str:
    name = parse_city_name(location)
    if name in DOMESTIC_SET:
        return "Domestic"
    return "International"


def generate_routes():
    """Build 100+ realistic domestic and international routes."""
    routes = []
    seen = set()

    def add(origin, destination, flight_type):
        if origin == destination:
            return
        key = (origin, destination)
        if key in seen:
            return
        seen.add(key)
        routes.append({
            "origin": origin,
            "destination": destination,
            "flightType": flight_type,
            "origin_code": CITY_CODES.get(origin, origin[:3].upper()),
            "destination_code": CITY_CODES.get(destination, destination[:3].upper()),
        })

    # Explicit examples from spec
    domestic_pairs = [
        ("Ahmedabad", "Delhi"), ("Delhi", "Mumbai"), ("Bangalore", "Chennai"),
        ("Mumbai", "Goa"), ("Delhi", "Jaipur"), ("Hyderabad", "Kolkata"),
        ("Pune", "Mumbai"), ("Chennai", "Bangalore"), ("Kolkata", "Delhi"),
        ("Jaipur", "Mumbai"), ("Goa", "Bangalore"), ("Ahmedabad", "Mumbai"),
        ("Delhi", "Hyderabad"), ("Mumbai", "Chennai"), ("Bangalore", "Mumbai"),
        ("Pune", "Delhi"), ("Kolkata", "Chennai"), ("Hyderabad", "Bangalore"),
    ]
    for o, d in domestic_pairs:
        add(o, d, "Domestic")
        add(d, o, "Domestic")

    international_pairs = [
        ("Delhi", "Singapore"), ("Mumbai", "Dubai"), ("Singapore", "Tokyo"),
        ("Bangkok", "Seoul"), ("Delhi", "London"), ("Mumbai", "Bangkok"),
        ("Bangalore", "Singapore"), ("Chennai", "Kuala Lumpur"),
        ("Hyderabad", "Dubai"), ("Kolkata", "Bangkok"), ("Delhi", "Tokyo"),
        ("Mumbai", "Singapore"), ("Delhi", "Dubai"), ("Bangalore", "Hong Kong"),
    ]
    for o, d in international_pairs:
        if o == "London":
            continue
        add(o, d, "International")
        add(d, o, "International")

    import random
    random.seed(42)
    while len(routes) < 120:
        if random.random() < 0.45:
            o = random.choice(DOMESTIC_CITIES)
            d = random.choice(DOMESTIC_CITIES)
            ft = "Domestic"
        else:
            o = random.choice(DOMESTIC_CITIES + INTERNATIONAL_CITIES)
            d = random.choice(INTERNATIONAL_CITIES + DOMESTIC_CITIES)
            if parse_city_name(o) in DOMESTIC_SET and parse_city_name(d) in DOMESTIC_SET:
                ft = "Domestic"
            else:
                ft = "International"
        add(o, d, ft)

    return routes
