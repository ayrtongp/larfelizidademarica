import React, { ReactNode } from 'react'

interface Props {
  children: ReactNode;
  colsNumber: number
  mobileColsNumber?: number;
  gap?: number;
  className?: string
}

const GridM1 = ({ colsNumber, mobileColsNumber = 1, gap = 2, className, children }: Props) => {

  return (
    <div className={`grid grid-cols-${mobileColsNumber} sm:grid-cols-${colsNumber} gap-${gap} ${className}`}>
      {children}
    </div>
  )
}

export default GridM1
