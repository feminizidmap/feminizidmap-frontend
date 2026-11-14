'use client'

import { useState } from 'react';
import { Container, Nav, Navbar, NavbarBrand, NavbarToggle, NavbarCollapse } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';

export default function Navigation() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar expanded={expanded} expand="lg" className='mt-3'>
      <Container>
        <NavbarBrand className="d-flex" href="/">
          <div style={{ width: "50vw" }} className='d-inline-block d-lg-none'>
            <Image alt="FeminizidMap.org" src="/title.svg" className="float-start w-100 h-auto" width={0} height={0} />
          </div>
        </NavbarBrand>
        <NavbarToggle onClick={() => setExpanded(!expanded)} aria-controls="basic-navbar-nav" />
        <NavbarCollapse id="basic-navbar-nav">
          <Nav className="justify-content-between text-center w-100">
            <Link onClick={() => setExpanded(false)} className="nav-link fs-2" href="/">HOME</Link>
            <Link onClick={() => setExpanded(false)} className="nav-link fs-2" href="/about">ABOUT</Link>
            <Link onClick={() => setExpanded(false)} className="nav-link fs-2" href="/map">MAP</Link>
            <Link onClick={() => setExpanded(false)} className="nav-link fs-2" href="/database">DATABASE</Link>
            <Link onClick={() => setExpanded(false)} className="nav-link fs-2" href="/reports">REPORTS</Link>
            <Link onClick={() => setExpanded(false)} className="nav-link fs-2" href="/">TEAM</Link>
            <Link onClick={() => setExpanded(false)} className="nav-link fs-2" href="/">FAQ</Link>
          </Nav>
        </NavbarCollapse>
      </Container>
    </Navbar>
  );
};
